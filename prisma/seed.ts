import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client/extension";
import bcrypt from "bcryptjs";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed plans
  const plans = [
    {
      name: "Базовый",
      description: "Доступ к каналу на 30 дней",
      price: 5000,
      currency: "KZT",
      duration_days: 30,
    },
    {
      name: "Стандарт",
      description: "Доступ к каналу на 90 дней",
      price: 12000,
      currency: "KZT",
      duration_days: 90,
    },
    {
      name: "Премиум",
      description: "Доступ к каналу на 365 дней",
      price: 40000,
      currency: "KZT",
      duration_days: 365,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plans.indexOf(plan) + 1 },
      update: plan,
      create: plan,
    });
  }
  console.log("Plans seeded");

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
