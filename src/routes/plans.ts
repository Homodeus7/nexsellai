import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// GET /api/plans — return active plans
router.get('/', async (_req, res) => {
  const plans = await prisma.plan.findMany({
    where: { is_active: true },
    orderBy: { price: 'asc' },
  });
  res.json({ success: true, data: plans });
});

// GET /api/plans/find?group=basic&currency=USD — find plan by group and currency
router.get('/find', async (req, res) => {
  const { group, currency } = req.query;

  if (!group || !currency) {
    res.status(400).json({
      success: false,
      error: 'Missing required parameters: group and currency'
    });
    return;
  }

  const plan = await prisma.plan.findFirst({
    where: {
      is_active: true,
      plan_group: String(group).toLowerCase(),
      currency: String(currency).toUpperCase(),
    },
  });

  if (!plan) {
    res.status(404).json({
      success: false,
      error: `Plan not found for group=${group}, currency=${currency}`
    });
    return;
  }

  res.json({ success: true, data: plan });
});

export default router;
