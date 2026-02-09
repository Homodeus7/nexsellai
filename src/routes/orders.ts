import { Router } from "express";
import { z } from "zod/v4";
import { prisma } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";
import { createPayment } from "../services/freedom-pay.js";

const router = Router();

const createOrderSchema = z.object({
  plan_id: z.number().int().positive(),
  customer_email: z.string().email().optional(),
  customer_phone: z.string().optional(),
  customer_tg: z.string().optional(),
});

// POST /api/orders — create new order
router.post("/", validate(createOrderSchema), async (req, res) => {
  const { plan_id, customer_email, customer_phone, customer_tg } = req.body;

  const plan = await prisma.plan.findUnique({ where: { id: plan_id } });
  if (!plan || !plan.is_active) {
    res.status(404).json({ success: false, error: "Plan not found" });
    return;
  }

  const order = await prisma.order.create({
    data: {
      plan_id,
      customer_email,
      customer_phone,
      customer_tg,
      amount: plan.price,
    },
  });

  const description = plan.description || plan.name || `Order ${order.order_uid}`;
  const payment = await createPayment(
    order.order_uid,
    order.amount,
    plan.currency,
    description,
  );

  await prisma.order.update({
    where: { id: order.id },
    data: { freedom_payment_id: payment.payment_id },
  });

  res.status(201).json({
    success: true,
    data: {
      order_uid: order.order_uid,
      payment_url: payment.payment_url,
    },
  });
});

// GET /api/orders/:uid/status — check order status
router.get("/:uid/status", async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { order_uid: req.params.uid },
    select: {
      order_uid: true,
      status: true,
      amount: true,
      paid_at: true,
      created_at: true,
    },
  });

  if (!order) {
    res.status(404).json({ success: false, error: "Order not found" });
    return;
  }

  res.json({ success: true, data: order });
});

export default router;
