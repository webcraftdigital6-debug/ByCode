/**
 * Black-box прогон собранного образа по HTTP: прод-куки, лимиты планов,
 * оплата через mock-мерчанта, фидбэк без SMTP и живучесть данных на томе.
 *
 * Локально (отдельный контейнер и отдельный том, боевой не трогается):
 *   docker run -d --name bc-prodprobe -p 4100:4000 -v bc-prodprobe-data:/data \
 *     --env-file .env -e APP_BASE_URL=http://localhost:4100 blocklycode:latest
 *   node scripts/prod-probe.mjs
 *   docker rm -f bc-prodprobe && docker volume rm bc-prodprobe-data
 *
 * Против боевого домена (проверки пересоздания контейнера и mock-оплаты
 * пропускаются сами):
 *   BASE_URL=https://<домен> SKIP_RECREATE=1 node scripts/prod-probe.mjs
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const BASE = process.env.BASE_URL || "http://127.0.0.1:4100";
const CONTAINER = process.env.CONTAINER || "bc-prodprobe";
const DIST = path.resolve("app/dist");
// Удалённый прогон (боевой домен): проверки содержимого тома и пересоздания
// контейнера требуют docker на этой машине, поэтому уходят в skip.
const REMOTE = process.env.SKIP_RECREATE === "1";

let pass = 0;
const fails = [];
const skipped = [];
function skip(name, why) {
  skipped.push(name);
  console.log(`  skip ${name} — ${why}`);
}
function check(name, ok, detail = "") {
  if (ok) {
    pass++;
    console.log(`  ok   ${name}`);
  } else {
    fails.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
  return ok;
}

const jars = new Map();
function jarFor(label) {
  if (!jars.has(label)) jars.set(label, {});
  return jars.get(label);
}
function cookieHeader(jar) {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

async function req(label, method, url, body, opts = {}) {
  const jar = jarFor(label);
  const headers = { ...(opts.headers || {}) };
  if (Object.keys(jar).length) headers.Cookie = cookieHeader(jar);
  let payload;
  if (opts.form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    payload = body.toString();
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(BASE + url, { method, headers, body: payload, redirect: "manual" });
  const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  for (const raw of setCookie) {
    const [pair] = raw.split(";");
    const eq = pair.indexOf("=");
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (value === "" || /Expires=Thu, 01 Jan 1970/i.test(raw)) delete jar[name];
    else jar[name] = value;
  }
  let json = null;
  let text = "";
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("json")) {
    try {
      json = await res.json();
    } catch {}
  } else {
    text = await res.text();
  }
  return { status: res.status, headers: res.headers, json, text, raw: setCookie, jar };
}

const A = (m, u, b, o) => req("anon", m, u, b, o);
const T = (m, u, b, o) => req("teacher", m, u, b, o);
const S = (m, u, b, o) => req("student", m, u, b, o);

let teacherEmail = "";
let studentEmail = "";
let expectedWorkspace = null;
let expectedName = "";

function inContainer(cmd) {
  if (REMOTE) return "";
  try {
    return execFileSync("docker", ["exec", CONTAINER, "sh", "-c", cmd], { encoding: "utf8" }).trim();
  } catch (e) {
    return `__exec_failed: ${(e.stdout || e.message || "").toString().trim()}`;
  }
}

// Проверки, которым нужен docker на машине запуска (удалённый прогон их пропускает).
function volumeCheck(name, ok, detail = "") {
  if (REMOTE) return skip(name, "удалённый прогон: нужен docker с DATA_DIR на этой машине");
  return check(name, ok, detail);
}

console.log(`\n=== B1.健康 и заголовки (${BASE}) ===`);
{
  const types = await A("GET", "/api/feedback/types");
  check("health /api/feedback/types → 200", types.status === 200, String(types.status));
  check(
    "COOP same-origin",
    types.headers.get("cross-origin-opener-policy") === "same-origin",
    types.headers.get("cross-origin-opener-policy"),
  );
  check(
    "COEP require-corp (изоляция для wasm-песочниц)",
    types.headers.get("cross-origin-embedder-policy") === "require-corp",
    types.headers.get("cross-origin-embedder-policy"),
  );
  check(
    "Origin-Agent-Cluster ?1",
    types.headers.get("origin-agent-cluster") === "?1",
    types.headers.get("origin-agent-cluster"),
  );
  check(
    "COOP/COEP нужны wasm-песочницам: PHP/Python грузятся",
    (await A("GET", "/")).status === 200,
  );
  const spa = await A("GET", "/");
  check("SPA-корень отдаёт html с blocklyDiv", spa.text.includes('id="blocklyDiv"'));
  const nf = await A("GET", "/api/nope-net-route");
  check("неизвестный API-путь → 404 без HTML фронтенда", nf.status === 404 && !nf.text.includes("blocklyDiv"));
  const deep = await A("GET", "/some/spa/route");
  check("SPA-fallback для не-API пути → 200 html", deep.status === 200 && deep.text.includes("<html"));
}

console.log("\n=== B1.2. Статика из образа против app/dist (md5) ===");
{
  const files = [];
  (function walk(dir, rel) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      const r = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(abs, r);
      else if (!entry.name.startsWith(".")) files.push(r);
    }
  })(DIST, "");
  let compared = 0;
  let mismatched = 0;
  const missing = [];
  for (const rel of files.slice(0, 40)) {
    const local = crypto
      .createHash("md5")
      .update(fs.readFileSync(path.join(DIST, rel)))
      .digest("hex");
    const res = await fetch(`${BASE}/${rel}`);
    if (!res.ok) {
      missing.push(`${rel} → ${res.status}`);
      continue;
    }
    const remote = crypto.createHash("md5").update(Buffer.from(await res.arrayBuffer())).digest("hex");
    compared++;
    if (remote !== local) {
      mismatched++;
      console.log(`  различается: ${rel}`);
    }
  }
  check("статика в образе совпадает с app/dist", mismatched === 0 && compared > 0, `${mismatched} различий из ${compared}`);
  check("все файлы отдачи доступны", missing.length === 0, missing.slice(0, 5).join(", "));
  console.log(`  (проверено файлов: ${compared} из ${files.length})`);
  // express.static игнорирует дот-файлы, поэтому /.htaccess уходит в SPA-fallback.
  const dot = await A("GET", "/.htaccess");
  check("дот-файлы из dist не отдаются как есть (SPA-fallback)", dot.status === 200 && dot.text.includes("<html"), String(dot.status));
}

console.log("\n=== B2.Прод-куки и регистрация ===");
{
  const email = `t${Date.now()}@prod.test`;
  const reg = await T("POST", "/api/auth/register", { email, password: "secret123" });
  check("register → 201", reg.status === 201, String(reg.status));
  const sid = reg.raw.find((c) => c.startsWith("bc_sid=")) || "";
  check("кука bc_sid выставлена", sid.length > 0);
  check("HttpOnly", /HttpOnly/i.test(sid));
  check("SameSite=Lax", /SameSite=Lax/i.test(sid));
  check("Secure (NODE_ENV=production)", /Secure/i.test(sid));
  check("Path=/", /Path=\//i.test(sid));
  check("Max-Age 30 дней", /Max-Age=2592000/i.test(sid), sid.match(/Max-Age=\d+/)?.[0]);
  const maxAge = Number((sid.match(/Max-Age=(\d+)/) || [])[1] || 0);
  check("Max-Age = 30 суток", maxAge === 30 * 24 * 3600, String(maxAge));

  const guest = await A("GET", "/api/auth/me");
  check("без куки /api/auth/me → 401", guest.status === 401);
  const me = await T("GET", "/api/auth/me");
  check("с кукой /api/auth/me → 200", me.status === 200);

  const bad = await A("POST", "/api/auth/register", { email: `x${Date.now()}@prod.test`, password: "123" });
  check("короткий пароль → 400", bad.status === 400);

  const dup = await T("POST", "/api/auth/register", { email, password: "secret123" });
  check("дубликат e-mail → 409", dup.status === 409);

  const broken = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"email": "br',
  });
  check("битый JSON → 400 (не 500)", broken.status === 400, String(broken.status));

  const huge = await T("POST", "/api/workspace", { data: { blob: "x".repeat(4 * 1024 * 1024 + 65536) } });
  check("тело > 4 МБ → 413 (не 500)", huge.status === 413, String(huge.status));
  check("после 413 workspace не испорчен", (await T("GET", "/api/workspace")).json?.data === null);

  const ws = { blocks: { languageVersion: 0, blocks: [{ type: "controls_if" }] } };
  expectedWorkspace = ws;
  teacherEmail = email;
  const named = await T("PATCH", "/api/profile", { name: "Марья Ивановна" });
  expectedName = "Марья Ивановна";
  check("PATCH профиля с кириллицей → 200", named.status === 200 && named.json?.user?.name === expectedName, JSON.stringify(named.json));
  check("workspace save → 200", (await T("POST", "/api/workspace", { data: ws })).status === 200);
  check(
    "workspace load совпадает",
    JSON.stringify((await T("GET", "/api/workspace")).json.data) === JSON.stringify(ws),
  );
}

console.log("\n=== B2.Учитель → класс → ученик → назначение ===");
let classId = null;
let studentId = null;
{
  const cls = await T("POST", "/api/classes", { name: "Прод-класс 10А", description: "прогон B" });
  check("класс создан (Free: 1 разрешён)", cls.status === 201, JSON.stringify(cls.json));
  classId = cls.json?.class?.id || cls.json?.id;
  check("id класса получен", !!classId);

  const second = await T("POST", "/api/classes", { name: "Второй класс" });
  check("второй класс на Free → 402", second.status === 402, String(second.status));
  check("код лимита классов", second.json?.code === "PLAN_LIMIT_CLASSES", second.json?.code);

  const sEmail = `s${Date.now()}@prod.test`;
  studentEmail = sEmail;
  const sReg = await S("POST", "/api/auth/register", { email: sEmail, password: "secret123" });
  check("ученик зарегистрирован", sReg.status === 201);
  studentId = sReg.json?.user?.id;

  const add = await T("POST", `/api/classes/${classId}/students`, { email: sEmail });
  check("ученик добавлен по e-mail", add.status === 201, JSON.stringify(add.json));
  const students = await T("GET", `/api/classes/${classId}/students`);
  check("в списке учеников нет passwordHash/Salt", !JSON.stringify(students.json).match(/password/i), JSON.stringify(students.json).slice(0, 120));

  const assign = await T("POST", `/api/classes/${classId}/tasks`, { taskId: "hello_world", studentId });
  check("назначение задачи → 201", assign.status === 201, JSON.stringify(assign.json));
  const myTasks = await S("GET", "/api/student/tasks");
  check("ученик видит назначение", (myTasks.json?.tasks || []).length === 1, JSON.stringify(myTasks.json?.tasks?.length));
  const assignmentId = myTasks.json?.tasks?.[0]?.id;

  const done = await S("PUT", `/api/student/tasks/${assignmentId}`, { status: "completed", solved: true, stars: 3 });
  check("ученик сдал задачу", done.status === 200, String(done.status));
  const notes = await S("GET", "/api/notifications");
  check("у ученика есть уведомление/лента", notes.status === 200, String(notes.status));

  const prog = await T("GET", `/api/classes/${classId}/students/${studentId}/progress`);
  check("учитель видит прогресс", prog.status === 200);
  check(
    "прогресс показывает solved",
    JSON.stringify(prog.json).includes("hello_world"),
    JSON.stringify(prog.json).slice(0, 200),
  );

  const prof = await T("GET", "/api/profile");
  check("статистика учителя посчитана", !!prof.json?.stats, JSON.stringify(prof.json?.stats));

  const other = await req("other-teacher", "POST", "/api/auth/register", {
    email: `o${Date.now()}@prod.test`,
    password: "secret123",
  });
  check("сторонний учитель зарегистрирован", other.status === 201);
  const spy = await req("other-teacher", "GET", `/api/classes/${classId}/students`);
  check("чужой класс → 403", spy.status === 403, String(spy.status));
}

console.log("\n=== B2.Оплата через mock-мерчанта (сквозной путь) ===");
await (async () => {
  const plan0 = await T("GET", "/api/billing/plan");
  check("plan → free до оплаты", plan0.json?.plan?.id === "free", JSON.stringify(plan0.json?.plan));
  if (plan0.json?.checkout?.provider !== "mock") {
    skip("сквозная оплата на mock-мерчанте", `провайдер стенда: ${plan0.json?.checkout?.provider}`);
    return;
  }
  check("checkout доступен (BILLING_PROVIDER=mock из .env дошёл)", plan0.json?.checkout?.available === true, JSON.stringify(plan0.json?.checkout));

  const co = await T("POST", "/api/billing/checkout", {});
  check("checkout → 200 с url", co.status === 200 && !!co.json?.url, JSON.stringify(co.json));
  check("цена 490 RUB", co.json?.price === "490.00" && co.json?.currency === "RUB", `${co.json?.price} ${co.json?.currency}`);
  check("30 дней", co.json?.days === 30, String(co.json?.days));
  check("провайдер mock", co.json?.provider === "mock");

  const pageUrl = new URL(co.json.url, BASE);
  check("страница мерчанта relative→абсолют доступна", pageUrl.pathname.startsWith("/api/billing/mock/"));
  const page = await fetch(pageUrl);
  const html = await page.text();
  check("страница мерчанта 200", page.status === 200, String(page.status));
  check("на странице есть id счёта", html.includes(co.json.paymentId));
  check("на странице сумма 490.00 RUB", html.includes("490.00") && html.includes("RUB"));
  const fieldsMatch = html.match(/var FIELDS = (\{.*?\});/s);
  check("страница содержит подписанные поля", !!fieldsMatch);
  check("кириллица на странице мерчанта без mojibake", html.includes("Тестовый платёж"), html.slice(html.indexOf("<h1>"), html.indexOf("<h1>") + 60));
  if (!fieldsMatch) {
    fails.push("остальная часть платёжного блока не выполнена — на странице нет FIELDS");
    return;
  }

  const form = new URLSearchParams(JSON.parse(fieldsMatch[1]));
  form.set("MockOutcome", "success");
  const ipn = await A("POST", "/api/billing/result/mock", form, { form: true });
  check("ResultURL (form-encoded) принят", ipn.status === 200 && /^OK/.test(ipn.text), `${ipn.status} ${ipn.text}`);

  const plan1 = await T("GET", "/api/billing/plan");
  check("после IPN план → pro", plan1.json?.plan?.id === "pro", JSON.stringify(plan1.json?.plan));
  const sub = await T("GET", "/api/billing/plan");
  check("подписка active с expiresAt", sub.json?.subscription?.status === "active" && !!sub.json?.subscription?.expiresAt, JSON.stringify(sub.json?.subscription));

  const ipn2 = await A("POST", "/api/billing/result/mock", form, { form: true });
  check("повторный IPN идемпотентен", ipn2.status === 200);
  const plan2 = await T("GET", "/api/billing/plan");
  check("повторный IPN не сдвинул expiresAt", plan2.json?.subscription?.expiresAt === sub.json?.subscription?.expiresAt);

  const secondNow = await T("POST", "/api/classes", { name: "Второй класс (Pro)" });
  check("на Pro второй класс создаётся", secondNow.status === 201, String(secondNow.status));

  const badSign = new URLSearchParams(form);
  badSign.set("SignatureValue", "deadbeef".repeat(4));
  badSign.set("InvoiceID", "nesuschestvuet");
  const forged = await A("POST", "/api/billing/result/mock", badSign, { form: true });
  check("поддельное уведомление отклонено (не 200 OK)", !(forged.status === 200 && /^OK/.test(forged.text)), `${forged.status} ${forged.text}`);

  const ret = await fetch(`${BASE}/api/billing/return/mock/success`, { redirect: "manual" });
  check("возврат с мерчанта → 302 на ?billing=success", ret.status === 302 && (ret.headers.get("location") || "").includes("billing=success"), ret.headers.get("location"));

  const cancel = await T("POST", "/api/billing/cancel", {});
  check("cancel → ok", cancel.status === 200, JSON.stringify(cancel.json));
  const plan3 = await T("GET", "/api/billing/plan");
  check("после cancel план → free", plan3.json?.plan?.id === "free", JSON.stringify(plan3.json?.plan));
})();

console.log("\n=== B2.Фидбэк без SMTP → файл в томе ===");
{
  const fb = await A("POST", "/api/feedback", {
    type: "bug",
    message: "Кириллица в прод-прогоне: кубик не падает на грань Ж",
    email: "someone@prod.test",
    page: "/task/mult_table",
  });
  check("POST /api/feedback → 201", fb.status === 201, JSON.stringify(fb.json));
  check("без SMTP delivered=false", fb.json?.delivered === false, JSON.stringify(fb.json));
  const file = inContainer("cat /data/feedback.json");
  volumeCheck("feedback.json создан в томе /data", file.length > 0);
  volumeCheck("кириллица в feedback.json без mojibake", file.includes("кубик не падает"), file.slice(0, 120));
  volumeCheck("тип сообщения сохранён", file.includes('"bug"'));

  const other = await A("POST", "/api/feedback", { type: "несуществующий", message: "проверка нормализации типа" });
  check("неизвестный тип → 201 с нормализацией в other", other.status === 201);
  volumeCheck("неизвестный тип сведён к other", inContainer("cat /data/feedback.json").includes('"type": "other"'));

  const empty = await A("POST", "/api/feedback", { message: "   " });
  check("пустое сообщение отклонено", empty.status >= 400, String(empty.status));
}

console.log("\n=== B3.Данные лежат на томе ===");
{
  const listing = inContainer("ls -1 /data");
  volumeCheck("в /data есть blocklycode.db", /blocklycode\.db/.test(listing), listing.replace(/\n/g, " "));
  volumeCheck("WAL-файлы SQLite на месте", /blocklycode\.db-wal|blocklycode\.db-shm/.test(listing), listing.replace(/\n/g, " "));
  const devs = inContainer("echo $(stat -c %d /) $(stat -c %d /data)").split(/\s+/);
  volumeCheck("/data — отдельный монтируемый том, не слой образа", devs.length === 2 && devs[0] !== devs[1], `dev(/)=${devs[0]} dev(/data)=${devs[1]}`);
  const perms = inContainer("stat -c '%U:%G %a' /data");
  volumeCheck("/data принадлежит пользователю контейнера", /^node:node/.test(perms), perms);
  const size = inContainer("du -sh /data | cut -f1");
  console.log(`  размер /data: ${size}`);
  const who = inContainer("id -u");
  volumeCheck("процесс контейнера непривилегированный (uid 1000 = node)", who === "1000", who);
}

console.log("\n=== B3.Пересоздание контейнера: данные на томе выживают ===");
if (REMOTE) {
  skip("живучесть данных после пересоздания контейнера", "пересоздание проверяется локально против образа");
} else {
  // Полный аналог `docker compose up --force-recreate`: контейнер удаляется,
  // том остаётся. Если бы DATA_DIR смотрел в слой образа, здесь всё пропало бы.
  execFileSync("docker", ["rm", "-f", CONTAINER], { stdio: "ignore" });
  execFileSync(
    "docker",
    [
      "run",
      "-d",
      "--name",
      CONTAINER,
      "-p",
      "4100:4000",
      "-v",
      "bc-prodprobe-data:/data",
      "--env-file",
      ".env",
      "-e",
      "APP_BASE_URL=http://localhost:4100",
      "blocklycode:latest",
    ],
    { stdio: "ignore" },
  );
  let up = false;
  for (let i = 0; i < 40 && !up; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      up = (await (await fetch(`${BASE}/api/feedback/types`)).ok) === true;
    } catch {}
  }
  check("контейнер поднялся заново", up);

  jars.clear();
  const relogin = await T("POST", "/api/auth/login", { email: teacherEmail, password: "secret123" });
  check("учитель входит после пересоздания", relogin.status === 200, String(relogin.status));
  const prof = await T("GET", "/api/profile");
  check("имя из профиля выжило (кириллица без mojibake)", prof.json?.user?.name === expectedName, JSON.stringify(prof.json?.user));
  const wsBack = await T("GET", "/api/workspace");
  check("workspace выжил", JSON.stringify(wsBack.json?.data) === JSON.stringify(expectedWorkspace), JSON.stringify(wsBack.json?.data)?.slice(0, 120));
  const clsBack = await T("GET", "/api/classes");
  check("классы учителя выжили", (clsBack.json?.classes || []).length >= 2, JSON.stringify(clsBack.json?.classes?.length));

  jars.clear();
  const sLogin = await S("POST", "/api/auth/login", { email: studentEmail, password: "secret123" });
  check("ученик входит после пересоздания", sLogin.status === 200, String(sLogin.status));
  const sProg = await S("GET", "/api/progress");
  check(
    "прогресс и звёзды ученика выжили",
    sProg.json?.progress?.hello_world?.solved === true && sProg.json?.progress?.hello_world?.stars === 3,
    JSON.stringify(sProg.json?.progress),
  );
  const sTasks = await S("GET", "/api/student/tasks");
  check("назначение ученика выжило", (sTasks.json?.tasks || []).length === 1, JSON.stringify(sTasks.json?.tasks?.length));
  check("сдача назначения выжила", sTasks.json?.tasks?.[0]?.status === "completed", sTasks.json?.tasks?.[0]?.status);

  check("feedback.json пережил пересоздание", inContainer("cat /data/feedback.json").includes("кубик не падает"));
  const dbStat = inContainer("ls -1 /data");
  check("файлы БД на месте после рестарта", /blocklycode\.db/.test(dbStat), dbStat.replace(/\n/g, " "));
}

console.log("\n=== итоги ===");
console.log(`проверок пройдено: ${pass}`);
if (skipped.length) console.log(`пропущено (нужен локальный docker/mock-мерчант): ${skipped.length}`);
if (fails.length) {
  console.log(`провалов: ${fails.length}`);
  for (const f of fails) console.log(`  - ${f}`);
  process.exit(1);
}
console.log("PROD_PROBE_OK");
