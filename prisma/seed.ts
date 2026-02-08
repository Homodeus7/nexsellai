import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed plans - 3 тарифа × 4 валюты = 12 записей
  const plans = [
    // Базовый тариф - 4 валюты
    { plan_group: 'basic', name: 'Базовый', description: 'Доступ к платформе и базовым урокам', price: 99, currency: 'USD', duration_days: 365, sort_order: 1 },
    { plan_group: 'basic', name: 'Базовый', description: 'Доступ к платформе и базовым урокам', price: 8599, currency: 'KGS', duration_days: 365, sort_order: 1 },
    { plan_group: 'basic', name: 'Базовый', description: 'Доступ к платформе и базовым урокам', price: 49990, currency: 'KZT', duration_days: 365, sort_order: 1 },
    { plan_group: 'basic', name: 'Базовый', description: 'Доступ к платформе и базовым урокам', price: 9900, currency: 'RUB', duration_days: 365, sort_order: 1 },

    // PRO тариф - 4 валюты
    { plan_group: 'pro', name: 'PRO — Профессия', description: 'Полная программа «AI-менеджер маркетплейсов»', price: 199, currency: 'USD', duration_days: 365, sort_order: 2 },
    { plan_group: 'pro', name: 'PRO — Профессия', description: 'Полная программа «AI-менеджер маркетплейсов»', price: 17399, currency: 'KGS', duration_days: 365, sort_order: 2 },
    { plan_group: 'pro', name: 'PRO — Профессия', description: 'Полная программа «AI-менеджер маркетплейсов»', price: 99900, currency: 'KZT', duration_days: 365, sort_order: 2 },
    { plan_group: 'pro', name: 'PRO — Профессия', description: 'Полная программа «AI-менеджер маркетплейсов»', price: 17990, currency: 'RUB', duration_days: 365, sort_order: 2 },

    // Менторство - 4 валюты
    { plan_group: 'mentorship', name: 'Менторство', description: 'Индивидуальное сопровождение и личные сессии', price: 990, currency: 'USD', duration_days: 365, sort_order: 3 },
    { plan_group: 'mentorship', name: 'Менторство', description: 'Индивидуальное сопровождение и личные сессии', price: 86499, currency: 'KGS', duration_days: 365, sort_order: 3 },
    { plan_group: 'mentorship', name: 'Менторство', description: 'Индивидуальное сопровождение и личные сессии', price: 499000, currency: 'KZT', duration_days: 365, sort_order: 3 },
    { plan_group: 'mentorship', name: 'Менторство', description: 'Индивидуальное сопровождение и личные сессии', price: 75990, currency: 'RUB', duration_days: 365, sort_order: 3 },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plans.indexOf(plan) + 1 },
      update: plan,
      create: plan,
    });
  }
  console.log("Plans seeded - 12 plans (3 groups × 4 currencies)");

  // Seed admin user
  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.adminUser.upsert({
    where: { login: "admin" },
    update: { password_hash: passwordHash },
    create: {
      login: "admin",
      password_hash: passwordHash,
    },
  });
  console.log("Admin user seeded (login: admin, password: admin123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
