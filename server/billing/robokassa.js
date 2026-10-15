"use strict";
/**
 * Провайдер Robokassa: разовые платежи картой, принимает карты, выпущенные
 * за пределами РФ (страны СНГ), SETTLE в RUB — поэтому выбран основным.
 *
 * Формулы подписей — в ./signature.js. Имена параметров уведомления провайдер
 * отдаёт в двух поколениях API (Amount/OutSum, InvoiceID/InvId), поэтому
 * читаем оба варианта и отправляем оба в платёжной ссылке.
 */

const { linkSignature, verifyNotificationSignature } = require("./signature");

/** Копейки → строка суммы ровно в том формате, что ушёл провайдеру. */
function major(minor) {
  return (Number(minor) / 100).toFixed(2);
}

const PRODUCTION_CHECKOUT_URL = "https://auth.robokassa.ru/Merchant/Index.aspx";
const PRODUCTION_API_URL = "https://api.robokassa.ru";

function credentials() {
  return {
    login: String(process.env.ROBOKASSA_MERCHANT_LOGIN || "").trim(),
    pass1: String(process.env.ROBOKASSA_PASSWORD1 || "").trim(),
    pass2: String(process.env.ROBOKASSA_PASSWORD2 || "").trim(),
    isTest: process.env.ROBOKASSA_TEST_MODE === "1",
    checkoutUrl: process.env.ROBOKASSA_CHECKOUT_URL || PRODUCTION_CHECKOUT_URL,
    apiUrl: process.env.ROBOKASSA_API_URL || PRODUCTION_API_URL,
  };
}

function isConfigured() {
  const c = credentials();
  return Boolean(c.login && c.pass2);
}

/**
 * Ссылка на защищённую страницу оплаты. InvoiceID — id нашего платежа, по
 * нему мы сопоставим уведомление. ExpirationDate ограничивает срок оплаты.
 */
function createCheckout({ payment, config, urls, payerEmail }) {
  const c = credentials();
  const amount = major(payment.amount);
  const signature = linkSignature({
    login: c.login,
    amount,
    invoiceId: payment.id,
    secret: c.pass1 || c.pass2,
  });
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 10);
  const params = new URLSearchParams({
    MerchantLogin: c.login,
    Amount: amount,
    OutSum: amount,
    Currency: config.currency,
    InvoiceID: payment.id,
    InvId: payment.id,
    Description: config.productLabel,
    ExpirationDate: expires,
    SignatureValue: signature,
    SuccessURL: urls.successUrl,
    FailURL: urls.failUrl,
    ResultURL: urls.resultUrl,
  });
  if (c.isTest) params.set("IsTest", "1");
  if (payerEmail) params.set("Email", payerEmail);
  return { url: `${c.checkoutUrl}?${params.toString()}`, providerRef: payment.id };
}

function readNotification(req) {
  const body = req.body || {};
  const amount = body.Amount != null ? body.Amount : body.OutSum;
  const invoiceId = body.InvoiceID != null ? body.InvoiceID : body.InvId;
  return {
    invoiceId: invoiceId == null ? "" : String(invoiceId).trim(),
    amount: amount == null ? "" : String(amount).trim(),
    currency: String(body["Alpha-Currency"] || body.Currency || "").toUpperCase(),
    ref: body.PaymentID == null ? null : String(body.PaymentID),
    isTest: String(body.IsTest || "") === "1",
    signature: String(body.SignatureValue || ""),
    raw: body,
  };
}

function verify({ payment, notification }) {
  const c = credentials();
  return verifyNotificationSignature({
    login: c.login,
    amount: major(payment.amount),
    invoiceId: payment.id,
    secret: c.pass2,
    given: notification.signature,
  });
}

/**
 * Обратная проверка статуса счёта. Адрес эндпоинта настраивается через
 * ROBOKASSA_CONFIRM_URL: точный путь нужно сверить с кабинетом при первом
 * подключении (он менялся между версиями API).
 */
async function confirmPayment({ payment }) {
  const c = credentials();
  if (!c.pass1) return { success: false, error: "ROBOKASSA_PASSWORD1 не задан" };
  const amount = major(payment.amount);
  const params = new URLSearchParams({
    MerchantLogin: c.login,
    InvoiceID: payment.id,
    OutSum: amount,
    SignatureValue: linkSignature({
      login: c.login,
      amount,
      invoiceId: payment.id,
      secret: c.pass1,
    }),
  });
  if (c.isTest) params.set("IsTest", "1");
  const base = process.env.ROBOKASSA_CONFIRM_URL || `${c.apiUrl}/api/pay/Invoice/1/GetInvoiceInformation`;
  try {
    const res = await fetch(`${base}?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    return {
      success: Boolean(data.Success || data.success),
      status: data.Status || data.status || null,
      httpStatus: res.status,
    };
  } catch (e) {
    return { success: false, error: e && e.message ? e.message : String(e) };
  }
}

/** Обязательный ответ провайдеру на уведомление. */
function resultBody(invoiceId) {
  return `OK${invoiceId}`;
}

module.exports = {
  name: "robokassa",
  isConfigured,
  createCheckout,
  readNotification,
  verify,
  confirmPayment,
  resultBody,
};
