import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { adminGuardMiddleware } from "../../middleware/admin-guard.js";

const router = Router();
router.use(adminGuardMiddleware);

// GET /api/admin/stats
router.get("/", async (_req, res) => {
  const [totalOrders, paidOrders, totalRevenue, activeAccesses, totalPlans] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "paid" } }),
      prisma.order.aggregate({
        where: { status: "paid" },
        _sum: { amount: true },
      }),
      prisma.access.count({
        where: { is_revoked: false, expires_at: { gte: new Date() } },
      }),
      prisma.plan.count({ where: { is_active: true } }),
    ]);

  res.json({
    success: true,
    data: {
      total_orders: totalOrders,
      paid_orders: paidOrders,
      total_revenue: totalRevenue._sum.amount || 0,
      active_accesses: activeAccesses,
      active_plans: totalPlans,
    },
  });
});

export default router;
