CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE merchants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id      UUID NOT NULL REFERENCES merchants(id),
  amount           INTEGER NOT NULL CHECK (amount > 0),
  currency         VARCHAR(10) NOT NULL DEFAULT 'INR',
  customer_name    VARCHAR(100) NOT NULL,
  customer_email   VARCHAR(255) NOT NULL,
  status           VARCHAR(30) NOT NULL DEFAULT 'pending',
  idempotency_key  VARCHAR(255) UNIQUE NOT NULL,
  expires_at       TIMESTAMPTZ NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE refunds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id  UUID NOT NULL REFERENCES payments(id),
  amount      INTEGER NOT NULL CHECK (amount > 0),
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id       UUID NOT NULL REFERENCES payments(id),
  event_type       VARCHAR(50) NOT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending',
  attempt_count    INTEGER NOT NULL DEFAULT 0,
  last_attempt_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- indexes that matter for how you'll actually query this data
CREATE INDEX idx_payments_merchant_id ON payments(merchant_id);
CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_notifications_payment_id ON notifications(payment_id);