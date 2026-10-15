"use strict";
/**
 * Подписи платёжного провайдера (схема Robokassa).
 *
 * Провайдер считает подпись уведомления MD5 или SHA-256 в зависимости от
 * настройки магазина, поэтому проверка принимает оба варианта — иначе
 * переключение алгоритма в кабинете сломало бы приём платежей.
 */

const crypto = require("node:crypto");

function md5(value) {
  return crypto.createHash("md5").update(value, "utf8").digest("hex");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function equalHex(a, b) {
  const x = String(a || "").toLowerCase();
  const y = String(b || "").toLowerCase();
  if (x.length !== y.length || !x) return false;
  return crypto.timingSafeEqual(Buffer.from(x, "utf8"), Buffer.from(y, "utf8"));
}

/** Подпись создания платёжной ссылки: MD5(Login:Сумма:Счёт:Password1). */
function linkSignature({ login, amount, invoiceId, secret }) {
  return md5(`${login}:${amount}:${invoiceId}:${secret}`);
}

/** Подпись уведомления о платеже: MD5/SHA256(Login:Сумма:Счёт:Password2). */
function verifyNotificationSignature({ login, amount, invoiceId, secret, given }) {
  const base = `${login}:${amount}:${invoiceId}:`;
  return (
    equalHex(given, md5(`${base}${secret}`)) ||
    equalHex(given, sha256(`${base}${secret}`))
  );
}

module.exports = { md5, sha256, linkSignature, verifyNotificationSignature };
