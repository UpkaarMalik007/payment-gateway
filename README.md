# PayGate — Mini Payment Gateway

A simulated payment gateway built for the AND Payments full-stack assignment. Merchants can register, create payment requests (with a shareable link and QR code), and customers can complete or fail those payments through a separate public flow. Refunds, notification retries, and full delivery tracking are built on top.

## 🚀 Live URLs

- **API:** https://your-backend-url.onrender.com
- **Dashboard:** https://your-frontend-url.vercel.app
- **Repository:** https://github.com/UpkaarMalik007/payment-gateway

---

## 📚 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL (raw SQL via `pg`, no ORM) |
| **Caching & Queue** | Redis (Upstash) + BullMQ |
| **Authentication** | JWT (access + refresh tokens), bcrypt, Redis-based token blacklist |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS |
| **Hosting** | Backend & frontend on Render, DB on Neon, Redis on Upstash |

---

## 🔧 Local Setup

### Prerequisites

- Node.js (v18+)
- PostgreSQL database (e.g., [Neon](https://neon.tech) free tier)
- Redis instance (e.g., [Upstash](https://upstash.com) free tier)

### Backend Setup

```bash
cd backend
npm install
```

**Configure environment variables:**

Create `.env` (copy from `.env.example`):

```env
DATABASE_URL=postgresql://[user]:[password]@[host]/[db]
REDIS_URL=rediss://[user]:[password]@[host]:[port]
JWT_ACCESS_SECRET=<run: openssl rand -base64 32>
JWT_REFRESH_SECRET=<a different long random string>
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Initialize the database:**

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

**Start the server:**

```bash
npm run dev
```

Verify: Visit `http://localhost:4000/health` → should return `{"status":"ok"}`

### Frontend Setup

```bash
cd frontend
npm install
```

**Configure environment variables:**

Create `.env` (copy from `.env.example`):

```env
VITE_API_URL=http://localhost:4000
```

**Start the development server:**

```bash
npm run dev
```

Visit `http://localhost:5173`

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────┐
│  React Dashboard (Merchant - Auth)      │
│  ↓                                      │
│  Public Pay Page (Customer - No Login)  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│        Express API                       │
├─────────────────────────────────────────┤
│  ├─ PostgreSQL                          │
│  │  (merchants, payments, refunds,      │
│  │   notifications)                     │
│  │                                      │
│  └─ Redis + BullMQ                      │
│     (token blacklist, job queue)        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Notification Worker (BullMQ)            │
│  Retries failed deliveries with backoff │
└─────────────────────────────────────────┘
```

### Trust Boundaries

Two distinct trust boundaries in one system:

1. **Authenticated Merchant Dashboard** — Merchants log in, create and manage payments.
2. **Public Pay Page** — Unauthenticated customers access payments via unguessable payment ID (similar to Stripe Payment Links or UPI).

---

## 📊 Database Schema

**Four tables** (plain SQL, no ORM) — see `db/schema.sql`:

| Table | Purpose |
|-------|---------|
| **merchants** | `id`, `name`, `email` (unique), `password` (bcrypt), `created_at` |
| **payments** | `id`, `merchant_id` (FK), `amount` (paise), `customer_name`, `customer_email`, `status`, `idempotency_key` (unique), `expires_at`, `created_at`, `updated_at` |
| **refunds** | `id`, `payment_id` (FK), `amount` (paise), `reason`, `created_at` |
| **notifications** | `id`, `payment_id` (FK), `event_type`, `status`, `attempt_count`, `last_attempt_at`, `created_at` |

### Payment Status Lifecycle

```
pending
  ├─→ completed ─→ partially_refunded → refunded
  ├─→ failed
  └─→ expired (if not completed within 15 min)
```

---

## 🎯 Key Design Decisions

### 1. PostgreSQL over MongoDB

**Why?** Payments have strict relational rules:
- A refund can never exceed its payment
- Every refund/notification must belong to exactly one payment
- Postgres enforces this at the database level with **foreign keys**, **CHECK constraints**, and **unique constraints** on idempotency keys — rather than relying entirely on application code.

### 2. Raw SQL over ORM

**Why?** Using the `pg` driver directly with parameterized queries:
- Every query is explicit and reviewable — nothing is hidden behind generation
- Queries are organized by module (e.g., `payments.queries.ts`)
- Multi-step operations use manual `BEGIN`/`COMMIT`/`ROLLBACK` transactions
- No surprises from ORM magic

### 3. Simulated Payment Completion

**Why?** The assignment's core requirements — lifecycle management, idempotency, refund validation, notification retries — are identical whether the payment is real or simulated. A real Razorpay/Stripe integration would require business KYC outside this scope and wouldn't change the state machine or refund logic.

**In production:** Only the `POST /pay/:id/complete` endpoint would be replaced by a real gateway's webhook listener — the rest stays the same.

### 4. Idempotency via Client-Generated Key

**How:** Frontend generates a fresh UUID per "create payment" click, sent as the `Idempotency-Key` header.

**Why:** The backend enforces uniqueness with a database constraint, not just application-level checks. It holds even under concurrent duplicate requests. Same key sent twice? Original payment is returned.

### 5. Payment Expiry with QR Code Sharing

**How:** Payments expire **15 minutes after creation**. Expiry is checked lazily (whenever a payment is read or acted on) — no background scheduler.

**Why:** Mimics real payment link/UPI behavior. QR code encodes the same pay link; scanning and clicking both lead to the identical public pay page.

### 6. JWT Access + Refresh Tokens with Redis Blacklist

**How:**
- **Access tokens** (15 min) → in-memory on frontend, never in localStorage
- **Refresh tokens** (7 days) → httpOnly, secure, sameSite cookie (invisible to JS)
- On logout → refresh token's `jti` stored in Redis with TTL = remaining lifetime

**Why:** Short-lived access tokens for security; secure cookies for refresh tokens; Redis blacklist ensures logged-out tokens are immediately revoked, even though JWTs are stateless.

### 7. Notifications via BullMQ (Real Webhook-like Behavior)

**How:** Every status change enqueues a BullMQ job. A worker attempts HTTP POST delivery with 5 retries and exponential backoff.

**Why:** Every attempt (success or failure) is logged to the `notifications` table. In production, the receiver URL comes from `webhookUrl` the merchant configures — sender-side logic unchanged.

### 8. IDOR Protection via Query Scoping

**How:** Every merchant-facing query includes `WHERE merchant_id = $1` from the verified JWT — never from request body or URL.

**Why:** A merchant requesting another merchant's payment by ID gets a 404, not their data.

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create merchant account |
| `POST` | `/auth/login` | Login & get tokens |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/auth/logout` | Logout & blacklist token |

### Merchant Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/merchants/me` | Get current merchant info |

### Payments (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/payments` | Create a new payment |
| `GET` | `/payments` | List all payments (merchant's) |
| `GET` | `/payments/:id` | Get payment details |
| `GET` | `/payments/:id/share` | Get shareable link & QR code |

### Public Pay Page

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/pay/:id` | View payment (no auth required) |
| `POST` | `/pay/:id/complete` | Complete or fail payment |

### Refunds (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/payments/:id/refunds` | Create refund |
| `GET` | `/payments/:id/refunds` | List refunds for payment |

### Notifications (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/payments/:id/notifications` | List delivery attempts |

---

## 🔐 Security Highlights

✅ **Password hashing** — bcrypt with salt  
✅ **Parameterized queries** — prevents SQL injection  
✅ **JWT + refresh tokens** — short-lived access, secure cookies  
✅ **Redis token blacklist** — instant logout  
✅ **Query scoping** — IDOR protection via merchant_id in WHERE clause  
✅ **HTTPS in production** — secure cookies, secure flag on tokens  
✅ **Idempotency keys** — prevents duplicate charge on retry
