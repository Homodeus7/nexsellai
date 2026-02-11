import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import * as readline from "readline";

dotenv.config();

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log("=== Смена пароля администратора ===\n");

  const login = await question("Введите логин администратора (по умолчанию 'admin'): ");
  const adminLogin = login.trim() || "admin";

  const newPassword = await question("Введите новый пароль: ");
  if (!newPassword.trim()) {
    console.error("Ошибка: пароль не может быть пустым");
    process.exit(1);
  }

  const confirm = await question("Подтвердите новый пароль: ");
  if (newPassword !== confirm) {
    console.error("Ошибка: пароли не совпадают");
    process.exit(1);
  }

  // Проверяем, существует ли пользователь
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { login: adminLogin },
  });

  if (!existingAdmin) {
    console.error(`Ошибка: администратор с логином "${adminLogin}" не найден`);
    process.exit(1);
  }

  // Хешируем новый пароль
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Обновляем пароль
  await prisma.adminUser.update({
    where: { login: adminLogin },
    data: { password_hash: passwordHash },
  });

  console.log(`\n✅ Пароль для администратора "${adminLogin}" успешно изменен!`);
}

main()
  .catch((e) => {
    console.error("Ошибка:", e);
    process.exit(1);
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });
