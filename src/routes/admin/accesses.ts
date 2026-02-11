import { Router } from "express";
import { z } from "zod/v4";
import { prisma } from "../../lib/prisma.js";
import { revokeInviteLink, createInviteLink } from "../../services/telegram.js";
import { adminGuardMiddleware } from "../../middleware/admin-guard.js";
import { validate } from "../../middleware/validate.js";

const router = Router();
router.use(adminGuardMiddleware);

const createAccessSchema = z.object({
  order_id: z.number().int().positive(),
  duration_days: z.number().int().positive().optional(),
});

// GET /api/admin/accesses
router.get("/", async (_req, res) => {
  const accesses = await prisma.access.findMany({
    include: { order: { include: { plan: true } } },
    orderBy: { created_at: "desc" },
  });
  res.json({ success: true, data: accesses });
});

// GET /api/admin/accesses/:id
router.get("/:id", async (req, res) => {
  const access = await prisma.access.findUnique({
    where: { id: Number(req.params.id) },
    include: { order: { include: { plan: true } } },
  });

  if (!access) {
    res.status(404).json({ success: false, error: "Access not found" });
    return;
  }

  res.json({ success: true, data: access });
});

// POST /api/admin/accesses
router.post("/", validate(createAccessSchema), async (req, res) => {
  const { order_id, duration_days } = req.body;

  const order = await prisma.order.findUnique({
    where: { id: order_id },
    include: { plan: true },
  });

  if (!order) {
    res.status(404).json({ success: false, error: "Order not found" });
    return;
  }

  const daysToAdd = duration_days || order.plan.duration_days;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + daysToAdd);

  let inviteLink = null;
  if (order.plan.telegram_channel_id) {
    try {
      inviteLink = await createInviteLink(
        order.plan.telegram_channel_id,
        expiresAt,
      );
    } catch (error) {
      console.error("Failed to create invite link:", error);
      // Продолжаем без invite link
    }
  }

  const access = await prisma.access.create({
    data: {
      order_id,
      expires_at: expiresAt,
      invite_link: inviteLink,
    },
    include: { order: { include: { plan: true } } },
  });

  res.status(201).json({ success: true, data: access });
});

// POST /api/admin/accesses/:id/revoke
router.post("/:id/revoke", async (req, res) => {
  const access = await prisma.access.findUnique({
    where: { id: Number(req.params.id) },
    include: { order: { include: { plan: true } } },
  });

  if (!access) {
    res.status(404).json({ success: false, error: "Access not found" });
    return;
  }

  if (access.invite_link && access.order.plan.telegram_channel_id) {
    await revokeInviteLink(
      access.order.plan.telegram_channel_id,
      access.invite_link,
    );
  }

  await prisma.access.update({
    where: { id: access.id },
    data: { is_revoked: true },
  });

  res.json({ success: true });
});

// POST /api/admin/accesses/:id/restore
router.post("/:id/restore", async (req, res) => {
  const access = await prisma.access.findUnique({
    where: { id: Number(req.params.id) },
    include: { order: { include: { plan: true } } },
  });

  if (!access) {
    res.status(404).json({ success: false, error: "Access not found" });
    return;
  }

  if (!access.is_revoked) {
    res.status(400).json({ success: false, error: "Access is not revoked" });
    return;
  }

  // Создаем новую инвайт-ссылку если канал указан
  let inviteLink = access.invite_link;
  if (access.order.plan.telegram_channel_id && new Date(access.expires_at) > new Date()) {
    try {
      inviteLink = await createInviteLink(
        access.order.plan.telegram_channel_id,
        new Date(access.expires_at),
      );
    } catch (error) {
      console.error("Failed to create invite link:", error);
    }
  }

  const updatedAccess = await prisma.access.update({
    where: { id: access.id },
    data: {
      is_revoked: false,
      invite_link: inviteLink,
    },
    include: { order: { include: { plan: true } } },
  });

  res.json({ success: true, data: updatedAccess });
});

export default router;
