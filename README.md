PayGate — Mini Payment Gateway

A simulated payment gateway built for the AND Payments full-stack assignment. Merchants can register, create payment requests (with a shareable link and QR code), and customers can complete or fail those payments through a separate public flow. Refunds, notification retries, and full delivery tracking are built on top.

Live URLs

API: https://your-backend-url.onrender.com
Dashboard: https://your-frontend-url.vercel.app
Repository: https://github.com/your-username/payment-gateway

Tech stack

LayerChoiceBackendNode.js, Express, TypeScriptDatabasePostgreSQL (raw SQL via pg, no ORM)Caching / QueueRedis (Upstash) + BullMQAuthJWT access + refresh tokens, bcrypt, Redis-based token blacklistFrontendReact, TypeScript, Vite, Tailwind CSS, Hosting Backend + frontend on Render, DB on Neon, Redis on Upstash

Setup — running locally

Prerequisites

Node.js (v18+)
A PostgreSQL database (I used Neon, free tier)
A Redis instance (I used Upstash, free tier)

Backend

bashcd backend
npm install

Copy .env.example to .env and fill in real values:

DATABASE_URL=postgresql://...
REDIS_URL=rediss://...
JWT_ACCESS_SECRET=<generate with: openssl rand -base64 32>
JWT_REFRESH_SECRET=<a different long random string>
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

Create the schema (run once):

bashpsql "$DATABASE_URL" -f db/schema.sql

Start the server:

bashnpm run dev

Visit http://localhost:4000/health — should return {"status":"ok"}.

Frontend

bashcd frontend
npm install

Copy .env.example to .env:

VITE_API_URL=http://localhost:4000

bashnpm run dev

Visit http://localhost:5173.

Architecture overview

React Dashboard (merchant, authenticated)
Public Pay Page (customer, no login)
│
▼
Express API ── PostgreSQL (merchants, payments, refunds, notifications)
│
└────── Redis (token blacklist, BullMQ job queue)
│
▼
Notification Worker (BullMQ)
retries failed deliveries with backoff

Two distinct trust boundaries exist in one system: an authenticated merchant dashboard, and a public, unauthenticated customer-facing payment page scoped only by an unguessable payment ID — mirroring how real payment links (e.g. UPI, Stripe Payment Links) work.

Database schema

Four tables, plain SQL (db/schema.sql), no ORM:

merchants — id, name, email (unique), password (bcrypt hash), created_at
payments — id, merchant_id (FK), amount (int, paise), customer_name, customer_email, status, idempotency_key (unique), expires_at, created_at, updated_at
refunds — id, payment_id (FK), amount (int, paise), reason, created_at
notifications — id, payment_id (FK), event_type, status, attempt_count, last_attempt_at, created_at

Payment status lifecycle:

pending → completed → partially_refunded → refunded
│
├─→ failed
└─→ expired (if not completed within 15 minutes)

Key design decisions

PostgreSQL over MongoDB. Payments have strict relational rules — a refund can never exceed its payment, every refund/notification must belong to exactly one payment. Postgres enforces this at the database level with foreign keys, CHECK constraints, and a unique constraint on idempotency_key, rather than relying entirely on application code to get every check right.

Raw SQL over an ORM. I use the pg driver directly with parameterized queries, organized as query functions per module (payments.queries.ts, etc.), instead of Prisma or another ORM. This means every query the app runs is explicit and reviewable — nothing is generated behind the scenes. Multi-step operations (like a refund + status update) use manual BEGIN/COMMIT/ROLLBACK transactions.

Simulated payment completion, not a real gateway integration. The assignment's core requirements — lifecycle management, idempotency, refund validation, notification retries — are identical in difficulty whether the underlying "payment" is real or simulated. A real Razorpay/Stripe integration would require business KYC and sandbox setup outside this assignment's scope, and wouldn't change how the payment state machine, idempotency, or refund logic is designed. In production, only the POST /pay/:id/complete endpoint would be replaced by a real gateway's webhook listener — the rest of the system stays the same.

Idempotency via a client-generated key. The frontend generates a fresh UUID per "create payment" click, sent as an Idempotency-Key header. The backend enforces uniqueness with a database constraint, not just an application-level check, so it holds even under concurrent duplicate requests. If the same key is sent twice, the original payment is returned instead of creating a duplicate.

Payment expiry with QR code sharing. Payment requests expire 15 minutes after creation, mimicking real payment link/UPI behavior. Expiry is enforced lazily — checked whenever a payment is read or acted on, rather than via a background scheduler — a deliberate scope trade-off for this assignment's size. The QR code simply encodes the same pay link; scanning it and clicking the link lead to the identical public pay page.

JWT access + refresh tokens with Redis-based blacklisting. Access tokens are short-lived (15 min) and never stored in localStorage — they're kept in memory on the frontend. Refresh tokens (7 days) live in an httpOnly, secure, sameSite cookie, invisible to frontend JavaScript. On logout, the refresh token's unique jti is stored in Redis with a TTL equal to its remaining lifetime, so a logged-out token is immediately unusable even though JWTs are otherwise stateless and can't normally be individually revoked.

Notifications via BullMQ, treated as real webhooks. Every status change (completed, failed, refunded, partially refunded, expired) enqueues a job. A worker attempts delivery via an HTTP POST to a webhook receiver, with 5 retry attempts and exponential backoff on failure. Every attempt — success or failure — is logged to the notifications table, satisfying the requirement that all delivery attempts be tracked. In production, the receiver URL would come from a webhookUrl field the merchant configures; the sender-side logic wouldn't need to change.

IDOR protection via query scoping, not application-level checks. Every merchant-facing query includes WHERE merchant_id = $1 using the ID from the verified JWT — never from the request body or URL. A merchant requesting another merchant's payment by ID gets a 404, not their data.

API endpoints

Auth — POST /auth/register, POST /auth/login, POST /auth/refresh, POST /auth/logout

Merchant — GET /merchants/me

Payments (merchant, authenticated) — POST /payments, GET /payments, GET /payments/:id, GET /payments/:id/share

Pay page (public) — GET /pay/:id, POST /pay/:id/complete

Refunds (merchant, authenticated) — POST /payments/:id/refunds, GET /payments/:id/refunds

Notifications (merchant, authenticated) — GET /payments/:id/notifications
