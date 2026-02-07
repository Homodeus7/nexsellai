# NexSell AI Backend

Express + Prisma + SQLite backend for selling access to Telegram channels via Freedom Pay.

## Tech Stack

- **Runtime:** Node.js, TypeScript, ESM
- **Framework:** Express 5
- **ORM:** Prisma 7 + better-sqlite3
- **Validation:** Zod
- **Auth:** JWT (jsonwebtoken + bcryptjs)
- **Telegram:** Telegraf (stub)
- **Payments:** Freedom Pay (stub)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create .env from template
cp .env.example .env

# 3. Run migration + generate Prisma client
npx prisma migrate dev

# 4. Seed database (3 plans + admin user)
npm run seed

# 5. Start dev server (hot reload)
npm run dev
```

Server starts at `http://localhost:3001`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled JS (production) |
| `npm run seed` | Seed database with initial data |
| `npm run studio` | Open Prisma Studio (DB UI) |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `DATABASE_URL` | SQLite database path | `file:./dev.db` |
| `JWT_SECRET` | Secret for JWT tokens | - |
| `FREEDOM_PAY_MERCHANT_ID` | Freedom Pay merchant ID | - |
| `FREEDOM_PAY_SECRET_KEY` | Freedom Pay secret key | - |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | - |
| `TELEGRAM_CHANNEL_ID` | Telegram channel ID | - |

## API Endpoints

### Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/plans` | List active plans |
| POST | `/api/orders` | Create order + get payment URL |
| GET | `/api/orders/:uid/status` | Check order status |
| POST | `/api/webhooks/freedom` | Freedom Pay webhook |

### Admin (JWT required)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/login` | Get JWT token |
| GET | `/api/admin/orders` | List all orders |
| GET | `/api/admin/orders/:id` | Get order details |
| GET | `/api/admin/plans` | List all plans |
| POST | `/api/admin/plans` | Create plan |
| PUT | `/api/admin/plans/:id` | Update plan |
| DELETE | `/api/admin/plans/:id` | Deactivate plan |
| GET | `/api/admin/accesses` | List all accesses |
| POST | `/api/admin/accesses/:id/revoke` | Revoke access |
| GET | `/api/admin/stats` | Dashboard statistics |

## Usage Examples

### Get plans

```bash
curl http://localhost:3001/api/plans
```

### Create order

```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{"plan_id": 1, "customer_email": "user@example.com", "customer_tg": "@username"}'
```

### Admin login

```bash
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"login": "admin", "password": "admin123"}'
```

### Use admin endpoints

```bash
TOKEN="<token from login>"

curl http://localhost:3001/api/admin/stats \
  -H "Authorization: Bearer $TOKEN"
```

## Database

SQLite database is stored at `prisma/dev.db`. To reset:

```bash
npx prisma migrate reset
npm run seed
```

To explore data visually:

```bash
npm run studio
```

## Project Structure

```
src/
  app.ts              # Express setup, middleware, routes
  server.ts           # Entry point
  config/
    env.ts            # Zod-validated env variables
  lib/
    prisma.ts         # Singleton Prisma client
  middleware/
    auth.ts           # JWT verification
    validate.ts       # Zod request validation
  routes/
    plans.ts          # Public plans
    orders.ts         # Public orders
    webhooks.ts       # Freedom Pay webhook
    admin/
      auth.ts         # Admin login
      orders.ts       # Admin orders
      plans.ts        # Admin plans CRUD
      accesses.ts     # Access management
      stats.ts        # Dashboard stats
  services/
    freedom-pay.ts    # Freedom Pay integration (stub)
    telegram.ts       # Telegram bot (stub)
    notification.ts   # User notifications (stub)
```

## Default Seed Data

**Plans:**
- Базовый -- 5 000 KZT / 30 days
- Стандарт -- 12 000 KZT / 90 days
- Премиум -- 40 000 KZT / 365 days

**Admin:** login `admin`, password `admin123`
