import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== Проверка администраторов в БД ===\n");

  const admins = await prisma.adminUser.findMany({
    select: {
      id: true,
      login: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (admins.length === 0) {
    console.log("❌ В базе данных нет ни одного администратора!");
    console.log("\nЧтобы создать администратора, запусти:");
    console.log("npm run seed");
  } else {
    console.log(`✅ Найдено администраторов: ${admins.length}\n`);
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. Логин: ${admin.login}`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Создан: ${admin.created_at.toLocaleString()}`);
      console.log(`   Обновлен: ${admin.updated_at.toLocaleString()}`);
      console.log();
    });
  }
}

main()
  .catch((e) => {
    console.error("Ошибка:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
