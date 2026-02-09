import { z } from 'zod/v4';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  FREEDOM_PAY_MERCHANT_ID: z.string().min(1),
  FREEDOM_PAY_SECRET_KEY: z.string().min(1),
  FREEDOM_PAY_API_BASE_URL: z.string().min(1).default('https://api.freedompay.kg'),
  FREEDOM_PAY_RESULT_URL: z.string().min(1),
  FREEDOM_PAY_SUCCESS_URL: z.string().min(1),
  FREEDOM_PAY_FAILURE_URL: z.string().min(1),
  FREEDOM_PAY_TESTING_MODE: z.coerce.number().int().default(1),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_CHANNEL_ID: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.issues);
  process.exit(1);
}

export const env = parsed.data;
