/**
 * Биллинг: тарифы Free/Pro, лимиты, промокоды.
 * Сервер — источник истины (GET /api/billing/plan), здесь только типы и API-обёртка.
 */

export type PlanId = "free" | "pro";

export interface PlanInfo {
  id: PlanId;
  name: string;
  maxClasses: number | null;
  maxStudents: number | null;
  monthlyAssignments: number | null;
}

export interface UsageInfo {
  classes: number;
  students: number;
  monthlyAssignments: number;
}

export interface SubscriptionInfo {
  plan: PlanId;
  status: string;
  promoCode: string | null;
  startedAt: string | null;
  expiresAt: string | null;
}

/** Оплата картой: availability зависит от настроек сервера (env провайдера). */
export interface CheckoutInfo {
  available: boolean;
  provider: string;
  price: string;
  currency: string;
  days: number;
}

export interface BillingState {
  plan: PlanInfo;
  usage: UsageInfo;
  subscription: SubscriptionInfo | null;
  checkout?: CheckoutInfo | null;
  promoEnabled?: boolean;
}

export interface CheckoutResult {
  url: string;
  paymentId: string;
  price: string;
  currency: string;
  days: number;
  provider: string;
}

export type PlanLimitCode =
  | "PLAN_LIMIT_CLASSES"
  | "PLAN_LIMIT_STUDENTS"
  | "PLAN_LIMIT_ASSIGNMENTS";

export interface PlanLimitError {
  code: PlanLimitCode;
  plan: PlanId;
  limit: number;
  usage: number;
  message: string;
}

/** Проверяет, является ли ответ сервера 402-ошибкой лимита тарифа. */
export function parsePlanLimitError(payload: unknown): PlanLimitError | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  const code = String(obj.code || "");
  const codes: PlanLimitCode[] = [
    "PLAN_LIMIT_CLASSES",
    "PLAN_LIMIT_STUDENTS",
    "PLAN_LIMIT_ASSIGNMENTS",
  ];
  if (!codes.includes(code as PlanLimitCode)) return null;
  return {
    code: code as PlanLimitCode,
    plan: (obj.plan as PlanId) || "free",
    limit: Number(obj.limit) || 0,
    usage: Number(obj.usage) || 0,
    message: String(obj.error || ""),
  };
}

async function fetchJson<T>(
  url: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`) as Error & {
      status?: number;
      payload?: unknown;
    };
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

export async function getBillingState(): Promise<BillingState> {
  return fetchJson<BillingState>("/api/billing/plan", "GET");
}

export async function upgradeWithPromoCode(
  promoCode: string,
): Promise<{ ok: boolean; plan: { id: PlanId; name: string }; expiresAt: string; usage: UsageInfo }> {
  return fetchJson("/api/billing/upgrade", "POST", { promoCode });
}

export async function cancelSubscription(): Promise<{ ok: boolean; plan: string }> {
  return fetchJson("/api/billing/cancel", "POST");
}

/**
 * Создаёт платёж и возвращает URL платёжной страницы провайдера.
 * Пессимистичный сценарий: страница оплаты открывается переходом, а подписку
 * включает уведомление провайдера на сервере — ответ браузера не учитывается.
 */
export async function startCheckout(): Promise<CheckoutResult> {
  return fetchJson<CheckoutResult>("/api/billing/checkout", "POST", {});
}
