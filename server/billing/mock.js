"use strict";
/**
 * Mock-провайдер для разработки и тестов: подписывает уведомления по той же
 * схеме, что и боевой провайдер, поэтому маршруты приёма платежа проверяются
 * целиком, без ключей Robokassa.
 *
 * Платёжная страница — наша собственная заглушка /api/billing/mock/:paymentId
 * с кнопками «успех» и «отказ».
 */

const { linkSignature, verifyNotificationSignature } = require("./signature");

const MOCK_LOGIN = "MOCKSHOP";
const MOCK_SECRET = "mock-password-2";

function credentials() {
  return {
    login: process.env.MOCK_MERCHANT_LOGIN || MOCK_LOGIN,
    secret: process.env.MOCK_NOTIFICATION_SECRET || MOCK_SECRET,
  };
}

function isConfigured() {
  return true;
}

function major(minor) {
  return (Number(minor) / 100).toFixed(2);
}

function createCheckout({ payment, config, urls, payerEmail }) {
  const c = credentials();
  const params = new URLSearchParams({
    MerchantLogin: c.login,
    Amount: major(payment.amount),
    Currency: config.currency,
    InvoiceID: payment.id,
    Description: config.productLabel,
    SignatureValue: linkSignature({
      login: c.login,
      amount: major(payment.amount),
      invoiceId: payment.id,
      secret: c.secret,
    }),
    SuccessURL: urls.successUrl,
    FailURL: urls.failUrl,
    ResultURL: urls.resultUrl,
    IsTest: "1",
    Email: payerEmail || "mock@example.local",
  });
  return { url: `/api/billing/mock/${encodeURIComponent(payment.id)}?${params.toString()}`, providerRef: payment.id };
}

function readNotification(req) {
  const body = req.body || {};
  return {
    invoiceId: String(body.InvoiceID == null ? "" : body.InvoiceID).trim(),
    amount: String(body.Amount == null ? "" : body.Amount).trim(),
    currency: String(body["Alpha-Currency"] || body.Currency || "").toUpperCase(),
    ref: body.PaymentID == null ? null : String(body.PaymentID),
    isTest: String(body.IsTest || "") === "1",
    signature: String(body.SignatureValue || ""),
    // mock-страница различает исход платежа одним скрытым полем
    outcome: String(body.MockOutcome || "success"),
    raw: body,
  };
}

function verify({ payment, notification }) {
  const c = credentials();
  return verifyNotificationSignature({
    login: c.login,
    amount: major(payment.amount),
    invoiceId: payment.id,
    secret: c.secret,
    given: notification.signature,
  });
}

async function confirmPayment() {
  return { success: true, status: "paid", mock: true };
}

function resultBody(invoiceId) {
  return `OK${invoiceId}`;
}

module.exports = {
  name: "mock",
  isConfigured,
  createCheckout,
  readNotification,
  verify,
  confirmPayment,
  resultBody,
  credentials,
  major,
};
