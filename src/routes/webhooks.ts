import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  buildWebhookResponse,
  extractPaymentIdentifiers,
  getScriptNameFromPath,
  normalizeCallbackStatus,
  verifyWebhookSignature,
} from "../services/freedom-pay.js";
import { createInviteLink } from "../services/telegram.js";
import { sendInviteToUser } from "../services/notification.js";

const router = Router();

// POST /api/webhooks/freedom — handle Freedom Pay webhook
router.post("/freedom", async (req, res) => {
  const scriptName = getScriptNameFromPath(req.path);
  const signature =
    (req.body?.pg_sig as string | undefined) ||
    (req.headers["x-signature"] as string | undefined) ||
    "";

  if (!verifyWebhookSignature(req.body, signature, scriptName)) {
    const xml = buildWebhookResponse(scriptName, "error", "Invalid signature");
    res.status(400).type("application/xml").send(xml);
    return;
  }

  const identifiers = extractPaymentIdentifiers(
    req.body as Record<string, unknown>,
  );
  const status = normalizeCallbackStatus(req.body as Record<string, unknown>);

  if (!identifiers.paymentId && !identifiers.orderId) {
    const xml = buildWebhookResponse(
      scriptName,
      "error",
      "Missing identifiers",
    );
    res.status(400).type("application/xml").send(xml);
    return;
  }

  const orConditions: Record<string, string>[] = [];
  if (identifiers.paymentId) {
    orConditions.push({ freedom_payment_id: identifiers.paymentId });
  }
  if (identifiers.orderId) {
    orConditions.push({ order_uid: identifiers.orderId });
  }

  const order = await prisma.order.findFirst({
    where: { OR: orConditions },
    include: { plan: true },
  });

  if (!order) {
    const xml = buildWebhookResponse(scriptName, "error", "Order not found");
    res.status(404).type("application/xml").send(xml);
    return;
  }

  if (status === "success") {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + order.plan.duration_days);

    // Получить ID канала из плана или использовать дефолтный
    const channelId = order.plan.telegram_channel_id;
    if (!channelId) {
      const xml = buildWebhookResponse(
        scriptName,
        "error",
        "Telegram channel not configured for this plan",
      );
      res.status(500).type("application/xml").send(xml);
      return;
    }

    const inviteLink = await createInviteLink(channelId, expiresAt);

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { status: "paid", paid_at: new Date() },
      }),
      prisma.access.create({
        data: {
          order_id: order.id,
          tg_user_id: order.customer_tg,
          invite_link: inviteLink,
          expires_at: expiresAt,
        },
      }),
    ]);

    await sendInviteToUser(inviteLink, {
      email: order.customer_email || undefined,
      phone: order.customer_phone || undefined,
      tg: order.customer_tg || undefined,
    });
  } else if (status === "failed") {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "failed" },
    });
  }

  const xml = buildWebhookResponse(scriptName, "ok", "Accepted");
  res.type("application/xml").send(xml);
});

export default router;
