# Руководство администратора - NexSell AI Backend

## Что это за система?

Это бэкенд для автоматической продажи доступа к Telegram каналам. Система принимает платежи через FreedomPay и автоматически выдает доступ к каналам.

---

## 1. Деплой на Vercel (Первая установка)

### Шаг 1: Подготовка проекта

1. Убедитесь, что проект загружен на GitHub
2. Зайдите на [vercel.com](https://vercel.com) и войдите через GitHub
3. Нажмите **"Add New Project"**

### Шаг 2: Импорт проекта

1. Выберите ваш GitHub репозиторий
2. Vercel автоматически определит настройки (проект уже настроен)
3. Нажмите **"Deploy"**

### Шаг 3: Настройка переменных окружения

**ВАЖНО:** После первого деплоя нужно добавить переменные окружения:

1. Зайдите в **Settings** → **Environment Variables**
2. Добавьте следующие переменные:

```
DATABASE_URL=your-database-url
JWT_SECRET=your-secret-key-here
FREEDOM_PAY_MERCHANT_ID=ваш-merchant-id
FREEDOM_PAY_SECRET_KEY=ваш-секретный-ключ
FREEDOM_PAY_API_BASE_URL=https://api.freedompay.kg
FREEDOM_PAY_RESULT_URL=https://ваш-домен.vercel.app/api/webhooks/freedom
FREEDOM_PAY_SUCCESS_URL=https://ваш-фронтенд-домен.com/success.html
FREEDOM_PAY_FAILURE_URL=https://ваш-фронтенд-домен.com/failure.html
FREEDOM_PAY_TESTING_MODE=1
TELEGRAM_BOT_TOKEN=токен-вашего-бота
TELEGRAM_CHANNEL_ID=id-вашего-канала
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ваш-безопасный-пароль
```

3. После добавления переменных нажмите **"Redeploy"** в разделе Deployments

### Шаг 4: Настройка базы данных

Рекомендуется использовать **Neon** (бесплатная PostgreSQL база):

1. Зайдите на [neon.tech](https://neon.tech)
2. Создайте новый проект
3. Скопируйте Connection String
4. Добавьте его как `DATABASE_URL` в Vercel
5. Redeploy проект

---

## 2. Обновление проекта (Redeploy)

После внесения изменений в код:

1. **Через Git:**
   ```bash
   git add .
   git commit -m "описание изменений"
   git push
   ```
   Vercel автоматически задеплоит новую версию

2. **Ручной redeploy:**
   - Зайдите в Vercel Dashboard
   - Откройте проект
   - Перейдите в **Deployments**
   - Нажмите на три точки у последнего деплоя → **Redeploy**

---

## 3. Смена пароля администратора

### Способ 1: Через команду (локально)

```bash
npm run change-password
```

Скрипт попросит ввести новый пароль и сохранит его в базу.

### Способ 2: Через переменные окружения

1. В Vercel → Settings → Environment Variables
2. Измените `ADMIN_PASSWORD` на новый пароль
3. Redeploy проект

### Способ 3: Через код (если нет доступа к серверу)

Создайте новый файл `scripts/quick-change-password.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function changePassword() {
  const newPassword = 'YOUR_NEW_PASSWORD' // Измените на новый пароль
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  await prisma.admin.updateMany({
    data: { password: hashedPassword }
  })

  console.log('✅ Пароль успешно изменен!')
}

changePassword()
```

Затем запустите: `tsx scripts/quick-change-password.ts`

---

## 4. Основные команды

### Разработка (локально)

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Просмотр базы данных (откроет Prisma Studio)
npm run studio

# Заполнить базу данных начальными данными
npm run seed
```

### Продакшн

```bash
# Собрать проект
npm run build

# Запустить собранную версию
npm start
```

### Работа с базой данных

```bash
# Применить миграции
npx prisma migrate deploy

# Сгенерировать Prisma клиент
npx prisma generate

# Посмотреть структуру БД
npm run studio

# Проверить пароль админа
npm run check-admin
```

---

## 5. Настройка переменных окружения

Создайте файл `.env` (локально) или настройте в Vercel:

### Обязательные переменные

| Переменная | Описание | Пример |
|------------|----------|--------|
| `DATABASE_URL` | Подключение к базе данных | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | Секретный ключ для токенов | `my-super-secret-key-123` |
| `ADMIN_USERNAME` | Логин администратора | `admin` |
| `ADMIN_PASSWORD` | Пароль администратора | `strong-password-123` |

### FreedomPay (платежи)

| Переменная | Описание |
|------------|----------|
| `FREEDOM_PAY_MERCHANT_ID` | ID мерчанта |
| `FREEDOM_PAY_SECRET_KEY` | Секретный ключ |
| `FREEDOM_PAY_API_BASE_URL` | URL API (обычно `https://api.freedompay.kg`) |
| `FREEDOM_PAY_RESULT_URL` | URL webhook для уведомлений об оплате |
| `FREEDOM_PAY_SUCCESS_URL` | URL страницы успешной оплаты |
| `FREEDOM_PAY_FAILURE_URL` | URL страницы ошибки оплаты |
| `FREEDOM_PAY_TESTING_MODE` | `1` для тестового режима, `0` для боевого |

### Telegram (уведомления)

| Переменная | Описание |
|------------|----------|
| `TELEGRAM_BOT_TOKEN` | Токен бота от @BotFather |
| `TELEGRAM_CHANNEL_ID` | ID канала по умолчанию |
| `TELEGRAM_CHANNEL_BASIC` | Канал для тарифа "Базовый" (опционально) |
| `TELEGRAM_CHANNEL_PRO` | Канал для тарифа "Стандарт" (опционально) |
| `TELEGRAM_CHANNEL_MENTORSHIP` | Канал для тарифа "Премиум" (опционально) |

---

## 6. Управление тарифными планами

### Через API (рекомендуется)

1. Получите токен авторизации:
```bash
curl -X POST https://ваш-домен.vercel.app/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"login":"admin","password":"ваш-пароль"}'
```

2. Создайте новый тариф:
```bash
curl -X POST https://ваш-домен.vercel.app/api/admin/plans \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ВАШ_ТОКЕН" \
  -d '{
    "name": "VIP план",
    "price": 50000,
    "currency": "KZT",
    "duration_days": 180,
    "description": "Доступ ко всем материалам на 6 месяцев"
  }'
```

3. Обновите тариф:
```bash
curl -X PUT https://ваш-домен.vercel.app/api/admin/plans/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ВАШ_ТОКЕН" \
  -d '{"price": 45000}'
```

4. Деактивируйте тариф:
```bash
curl -X DELETE https://ваш-домен.vercel.app/api/admin/plans/1 \
  -H "Authorization: Bearer ВАШ_ТОКЕН"
```

### Через Prisma Studio

```bash
npm run studio
```

Откроется веб-интерфейс где можно:
- Просматривать все тарифы
- Редактировать цены и описания
- Деактивировать тарифы (is_active = false)

---

## 7. Проверка работы системы

### Проверка здоровья API

```bash
curl https://ваш-домен.vercel.app/api/health
```

Должно вернуть: `{"status":"ok"}`

### Просмотр логов

В Vercel:
1. Перейдите в **Deployments**
2. Кликните на активный деплой
3. Откройте вкладку **Function Logs**

### Проверка базы данных

```bash
npm run studio
```

Посмотрите:
- **Plans** - активные тарифы
- **Orders** - все заказы и их статусы
- **Accesses** - выданные доступы
- **Admin** - учетные записи администраторов

---

## 8. Частые проблемы и решения

### Забыл пароль от админки

Используйте команду:
```bash
npm run change-password
```

### Не работает деплой на Vercel

1. Проверьте логи в разделе Deployments
2. Убедитесь что добавлены все переменные окружения
3. Проверьте что `DATABASE_URL` корректный

### Платежи не проходят

1. Проверьте `FREEDOM_PAY_TESTING_MODE=1` для тестов
2. Убедитесь что `FREEDOM_PAY_RESULT_URL` указывает на ваш домен
3. Проверьте логи webhook в Vercel

### Не выдается доступ к Telegram

1. Проверьте что бот добавлен в канал как администратор
2. Проверьте `TELEGRAM_BOT_TOKEN`
3. Убедитесь что у бота есть права добавлять участников

---

## 9. Безопасность

### Рекомендации

1. **JWT_SECRET** - используйте длинную случайную строку (минимум 32 символа)
2. **ADMIN_PASSWORD** - минимум 12 символов, буквы+цифры+символы
3. **Не храните** `.env` файл в Git (он в `.gitignore`)
4. **Регулярно меняйте** пароль администратора
5. **Включайте HTTPS** - Vercel делает это автоматически

### Генерация безопасных ключей

```bash
# JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ADMIN_PASSWORD
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"
```

---

## 10. Контакты и поддержка

- **Документация API:** `/docs/API_DESCRIPTION.md`
- **GitHub Issues:** Для сообщений об ошибках
- **Vercel Support:** [vercel.com/support](https://vercel.com/support)
- **FreedomPay Support:** Для вопросов по платежам

---

Последнее обновление: Февраль 2025
