import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyWebhookSignature } from '../services/freedom-pay.js';
import { createInviteLink } from '../services/telegram.js';
import { sendInviteToUser } from '../services/notification.js';

const router = Router();

// POST /api/webhooks/freedom — handle Freedom Pay webhook
router.post('/freedom', async (req, res) => {
  const signature = req.headers['x-signature'] as string || '';

  if (!verifyWebhookSignature(req.body, signature)) {
    res.status(400).json({ success: false, error: 'Invalid signature' });
    return;
  }

  const { order_id: freedomPaymentId, status } = req.body as {
    order_id: string;
    status: string;
  };

  const order = await prisma.order.findFirst({
    where: { freedom_payment_id: freedomPaymentId },
    include: { plan: true },
  });

  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' });
    return;
  }

  if (status === 'success') {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + order.plan.duration_days);

    const inviteLink = await createInviteLink(expiresAt);

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { status: 'paid', paid_at: new Date() },
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
  } else if (status === 'failed') {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'failed' },
    });
  }

  res.json({ success: true });
});

export default router;
