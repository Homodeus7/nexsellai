import { env } from '../config/env.js';

export interface PaymentResult {
  payment_id: string;
  payment_url: string;
}

export async function createPayment(orderUid: string, amount: number, currency: string): Promise<PaymentResult> {
  // TODO: Integrate with real Freedom Pay API
  console.log(`[FreedomPay] Creating payment for order ${orderUid}, amount: ${amount} ${currency}`);
  console.log(`[FreedomPay] Merchant ID: ${env.FREEDOM_PAY_MERCHANT_ID}`);

  return {
    payment_id: `fp_${Date.now()}`,
    payment_url: `https://pay.freedompay.kz/payment?order=${orderUid}&amount=${amount}`,
  };
}

export function verifyWebhookSignature(_body: Record<string, unknown>, _signature: string): boolean {
  // TODO: Implement real signature verification
  console.log('[FreedomPay] Webhook signature verification (stub)');
  return true;
}
