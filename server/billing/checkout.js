"use strict";
/**
 * Сценарий оплаты подписки: создание платежа и активация по уведомлению
 * провайдера. Никакая ветка не зависит от ответа браузера — подписка
 * включается только после проверенного server-to-server уведомления.
 */

const store = require("../store");
const { toMajor } = require("./index");

/** Продлевает Pro: активная подписка суммируется, истёкшая — считается от сейчас. */
function activatePro(userId, days) {
  const sub = store.getSubscription(userId);
  const t = Date.now();
  const stillActive =
    sub &&
    sub.plan === "pro" &&
    sub.status === "active" &&
    sub.expires_at &&
    new Date(sub.expires_at).getTime() > t;
  const from = stillActive ? new Date(sub.expires_at).getTime() : t;
  const expiresAt = new Date(from + days * 24 * 60 * 60 * 1000).toISOString();
  store.setSubscription({
    userId,
    plan: "pro",
    status: "active",
    promoCode: null,
    expiresAt,
  });
  return expiresAt;
}

/** Создаёт строку платежа и ссылку на страницу оплаты провайдера. */
async function startCheckout({ user, provider, config, urls }) {
  const payment = store.createPayment({
    id: `pay_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`,
    userId: user.id,
    provider: provider.name,
    plan: "pro",
    amount: config.minorAmount,
    currency: config.currency,
    days: config.days,
  });
  const checkout = await provider.createCheckout({
    payment,
    config,
    urls,
    payerEmail: user.email,
  });
  return { payment, checkout };
}

/**
 * Обработка уведомления провайдера. Возвращает {status, body} для HTTP-ответа.
 * Повторное уведомление оплаченного платежа отвечает успешно и ничего не меняет.
 */
async function handleNotification({ provider, config, req }) {
  const notification = provider.readNotification(req);
  const payment = notification.invoiceId
    ? store.getPayment(notification.invoiceId)
    : null;

  if (!payment) {
    return { status: 404, body: "Payment not found", notification };
  }
  if (payment.provider !== provider.name) {
    return { status: 403, body: "Provider mismatch", notification };
  }
  if (!provider.verify({ payment, notification })) {
    return { status: 403, body: "Bad signature", notification };
  }
  // Провайдер может прислать "490" или "490.0" — сравниваем как числа с точностью копеек
  if (
    notification.amount &&
    Math.abs(Number(notification.amount) - Number(toMajor(payment.amount))) > 0.005
  ) {
    return { status: 403, body: "Amount mismatch", notification };
  }
  if (notification.currency && notification.currency !== payment.currency) {
    return { status: 403, body: "Currency mismatch", notification };
  }

  if (payment.status === "paid") {
    return { status: 200, body: provider.resultBody(payment.id), notification, idempotent: true };
  }

  const failed = notification.outcome && notification.outcome !== "success";
  if (failed) {
    store.markPaymentFailed(payment.id, { providerRef: notification.ref, raw: notification.raw });
    return { status: 200, body: provider.resultBody(payment.id), notification, failed: true };
  }

  if (config.requireConfirm) {
    const confirmed = await provider.confirmPayment({ payment, notification, config });
    if (!confirmed || !confirmed.success) {
      return {
        status: 403,
        body: `Provider did not confirm payment: ${confirmed && confirmed.error ? confirmed.error : "not paid"}`,
        notification,
      };
    }
  }

  const marked = store.markPaymentPaid(payment.id, {
    providerRef: notification.ref,
    raw: notification.raw,
  });
  if (!marked.ok) {
    if (marked.reason === "already_paid") {
      return { status: 200, body: provider.resultBody(payment.id), notification, idempotent: true };
    }
    return { status: 404, body: "Payment not found", notification };
  }

  const expiresAt = activatePro(marked.payment.user_id, marked.payment.days);
  console.log(
    `[billing] оплачено: payment=${marked.payment.id} user=${marked.payment.user_id} provider=${provider.name} до ${expiresAt}`,
  );
  return {
    status: 200,
    body: provider.resultBody(marked.payment.id),
    notification,
    expiresAt,
    activated: true,
  };
}

module.exports = { activatePro, startCheckout, handleNotification };
