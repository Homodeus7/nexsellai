import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { adminGuardMiddleware } from '@/middleware/admin-guard.js';

const router = Router();
router.use(adminGuardMiddleware);

// GET /api/admin/orders
router.get('/', async (_req, res) => {
  const orders = await prisma.order.findMany({
    include: { plan: true, accesses: true },
    orderBy: { created_at: 'desc' },
  });
  res.json({ success: true, data: orders });
});

// GET /api/admin/orders/:id
router.get('/:id', async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: Number(req.params.id) },
    include: { plan: true, accesses: true },
  });

  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }

  res.json({ success: true, data: order });
});

export default router;
