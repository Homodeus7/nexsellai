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

export default router;
