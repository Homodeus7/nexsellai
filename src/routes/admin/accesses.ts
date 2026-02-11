import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { revokeInviteLink } from "../../services/telegram.js";
import { adminGuardMiddleware } from "../../middleware/admin-guard.js";

const router = Router();
router.use(adminGuardMiddleware);

// GET /api/admin/accesses
router.get("/", async (_req, res) => {
  const accesses = await prisma.access.findMany({
    include: { order: { include: { plan: true } } },
    orderBy: { created_at: "desc" },
  });
  res.json({ success: true, data: accesses });
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

export default router;
