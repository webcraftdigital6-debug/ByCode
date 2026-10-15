"use strict";
/**
 * Платёжный провайдер: единый интерфейс для списания разовой оплаты подписки.
 *
 * Обязанности адаптера:
 *   createCheckout — вернуть URL платёжной страницы провайдера для нашего
 *       платежа (InvoiceID = id платежа в нашей таблице payments);
 *   readNotification — привести тело уведомления провайдера к одному виду;
 *   verifySignature — проверить подпись уведомления;
 *   confirmPayment — обратный запрос статуса (обязателен при
 *       BILLING_REQUIRE_CONFIRM=1).
 *
 * Выбор провайдера и все параметры берутся из env при каждом обращении,
 * поэтому тесты и дев-режим могут переключать конфиг без рестарта процесса.
 */

const robokassa = require("./robokassa");
const mock = require("./mock");

const PROVIDERS = {
  robokassa: robokassa,
  mock: mock,
};

/** Рубли (или другая валюта с 2 знаками) → целые копейки. */
function toMinor(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}

/** Целые копейки → строка вида "490.00" ровно в том формате, что мы отдали провайдеру. */
function toMajor(minor) {
  return (Number(minor) / 100).toFixed(2);
}

function loadConfig() {
  const priceRub = Number(process.env.BILLING_PRICE_RUB || 490);
  const days = Number(process.env.BILLING_DAYS || 30);
  return {
    providerName: String(process.env.BILLING_PROVIDER || "none").toLowerCase(),
    minorAmount: Number.isFinite(priceRub) && priceRub > 0 ? Math.round(priceRub * 100) : 49000,
    currency: String(process.env.BILLING_CURRENCY || "RUB").toUpperCase(),
    days: Number.isFinite(days) && days > 0 ? Math.round(days) : 30,
    baseUrl: String(process.env.APP_BASE_URL || "").replace(/\/+$/, ""),
    promoEnabled: process.env.BILLING_PROMO_ENABLED === "1",
    requireConfirm: process.env.BILLING_REQUIRE_CONFIRM === "1",
    productLabel:
      process.env.BILLING_PRODUCT_LABEL ||
      "BlocklyCode: подписка Pro на 30 дней",
  };
}

/** Абсолютный базовый URL приложения: env, иначе — из запроса (dev-режим). */
function resolveBaseUrl(config, req) {
  if (config.baseUrl) return config.baseUrl;
  if (!req || !req.headers) return "";
  return `${req.protocol}://${req.get("host")}`;
}

/** Текущий провайдер + конфиг. `provider === null`, если оплата недоступна. */
function getBilling(req) {
  const config = loadConfig();
  const candidate = PROVIDERS[config.providerName] || null;
  const provider = candidate && candidate.isConfigured() ? candidate : null;
  return {
    config,
    provider,
    providerName: provider ? provider.name : "none",
    baseUrl: resolveBaseUrl(config, req),
  };
}

module.exports = {
  PROVIDER_NAMES: Object.keys(PROVIDERS),
  getBilling,
  resolveBaseUrl,
  toMinor,
  toMajor,
};
