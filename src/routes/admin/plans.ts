import { Router } from "express";
import { z } from "zod/v4";
import { prisma } from "../../lib/prisma.js";
import { validate } from "../../middleware/validate.js";
import { adminGuardMiddleware } from "@/middleware/admin-guard.js";

const router = Router();
router.use(adminGuardMiddleware);

const planSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  currency: z.string().default("KZT"),
  duration_days: z.number().int().positive(),
  is_active: z.boolean().default(true),
});

const updatePlanSchema = planSchema.partial();

// GET /api/admin/plans
router.get("/", async (_req, res) => {
  const plans = await prisma.plan.findMany({ orderBy: { id: "asc" } });
  res.json({ success: true, data: plans });
});

// POST /api/admin/plans
router.post("/", validate(planSchema), async (req, res) => {
  const plan = await prisma.plan.create({ data: req.body });
  res.status(201).json({ success: true, data: plan });
});

// PUT /api/admin/plans/:id
router.put("/:id", validate(updatePlanSchema), async (req, res) => {
  const plan = await prisma.plan.update({
    where: { id: Number(req.params.id) },
    data: req.body,
  });
  res.json({ success: true, data: plan });
});

// DELETE /api/admin/plans/:id
router.delete("/:id", async (req, res) => {
  await prisma.plan.update({
    where: { id: Number(req.params.id) },
    data: { is_active: false },
  });
  res.json({ success: true });
});

export default router;
