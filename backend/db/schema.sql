-- =============================================================
--  LeadAI — Complete Backend Schema
--  PostgreSQL 15+
--  Modules: Core · CRM · Expense Monitoring · Financial Intelligence
--  Generated: April 2026
-- =============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
--  ENUMS
-- =============================================================

CREATE TYPE business_tier         AS ENUM ('starter', 'growth', 'pro');
CREATE TYPE user_role              AS ENUM ('owner', 'admin', 'agent', 'viewer');
CREATE TYPE lead_status            AS ENUM ('new', 'contacted', 'qualified', 'booked', 'won', 'lost', 'unqualified');
CREATE TYPE lead_channel           AS ENUM ('whatsapp', 'instagram', 'facebook', 'tiktok', 'email', 'manual');
CREATE TYPE ai_confidence_tier     AS ENUM ('high', 'medium', 'low');
CREATE TYPE deal_status            AS ENUM ('new', 'qualified', 'booked', 'won', 'lost');
CREATE TYPE booking_status         AS ENUM ('pending', 'confirmed', 'completed', 'no_show', 'cancelled');
CREATE TYPE payment_status         AS ENUM ('initiated', 'pending', 'confirmed', 'failed', 'timeout', 'refunded');
CREATE TYPE payment_provider       AS ENUM ('mpesa', 'bank', 'cash', 'card', 'other');
CREATE TYPE transaction_type       AS ENUM ('revenue', 'expense', 'transfer', 'refund');
CREATE TYPE notification_channel   AS ENUM ('whatsapp', 'sms', 'push', 'email', 'in_app');
CREATE TYPE contact_status         AS ENUM ('active', 'inactive', 'blocked', 'archived');
CREATE TYPE contact_type           AS ENUM ('lead', 'customer', 'prospect', 'partner', 'other');
CREATE TYPE activity_type          AS ENUM ('call', 'message', 'meeting', 'email', 'note', 'task', 'demo', 'other');
CREATE TYPE task_priority          AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status            AS ENUM ('todo', 'in_progress', 'done', 'cancelled');
CREATE TYPE field_type             AS ENUM ('text', 'number', 'date', 'boolean', 'select', 'multi_select', 'url', 'phone');
CREATE TYPE expense_status         AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'paid');
CREATE TYPE import_source          AS ENUM ('mpesa_statement', 'bank_csv', 'bank_pdf', 'manual');
CREATE TYPE import_status          AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE match_status           AS ENUM ('matched', 'unmatched', 'skipped', 'manual');
CREATE TYPE frequency_type         AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'annually');
CREATE TYPE period_type            AS ENUM ('monthly', 'quarterly', 'annually');
CREATE TYPE reconcile_operator     AS ENUM ('contains', 'equals', 'starts_with', 'ends_with', 'greater_than', 'less_than');
CREATE TYPE direction_type         AS ENUM ('inbound', 'outbound');

-- =============================================================
--  MODULE 1 — CORE PLATFORM
-- =============================================================

-- 1.1 Businesses (root multi-tenant entity)
CREATE TABLE businesses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(255) NOT NULL,
    industry            VARCHAR(100),
    tier                business_tier NOT NULL DEFAULT 'starter',
    whatsapp_number     VARCHAR(20),
    meta_page_id        VARCHAR(100),
    mpesa_shortcode     VARCHAR(20),
    mpesa_passkey       TEXT,
    daraja_consumer_key TEXT,
    country_code        VARCHAR(5)  NOT NULL DEFAULT 'KE',
    currency            VARCHAR(5)  NOT NULL DEFAULT 'KES',
    timezone            VARCHAR(60) NOT NULL DEFAULT 'Africa/Nairobi',
    description         TEXT,
    products            TEXT,
    logo_url            TEXT,
    active              BOOLEAN     NOT NULL DEFAULT TRUE,
    trial_ends_at       TIMESTAMPTZ,
    subscribed_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.2 Users (staff & agents per business)
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    full_name           VARCHAR(255) NOT NULL,
    email               VARCHAR(255) NOT NULL,
    phone               VARCHAR(20),
    role                user_role   NOT NULL DEFAULT 'agent',
    password_hash       TEXT        NOT NULL,
    avatar_url          TEXT,
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (business_id, email)
);

-- 1.3 Leads (inbound enquiries from all channels)
CREATE TABLE leads (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    channel             lead_channel NOT NULL DEFAULT 'whatsapp',
    phone_number        VARCHAR(20),
    name                VARCHAR(255),
    status              lead_status  NOT NULL DEFAULT 'new',
    score               SMALLINT     NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
    assigned_to         UUID REFERENCES users(id) ON DELETE SET NULL,
    source_ref          VARCHAR(255),
    metadata            JSONB        NOT NULL DEFAULT '{}',
    first_contact_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_activity_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 1.4 Conversations (every message, both directions)
CREATE TABLE conversations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id             UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    channel             lead_channel    NOT NULL,
    direction           direction_type  NOT NULL,
    content             TEXT            NOT NULL,
    media_url           TEXT,
    ai_confidence_tier  ai_confidence_tier,
    confidence_score    SMALLINT CHECK (confidence_score BETWEEN 0 AND 100),
    auto_sent           BOOLEAN         NOT NULL DEFAULT FALSE,
    escalated           BOOLEAN         NOT NULL DEFAULT FALSE,
    owner_reviewed      BOOLEAN         NOT NULL DEFAULT FALSE,
    external_msg_id     VARCHAR(255),
    sent_at             TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- 1.5 AI Sessions (audit trail per LLM call)
CREATE TABLE ai_sessions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id     UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    lead_id             UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    model               VARCHAR(100)       NOT NULL,
    confidence_score    SMALLINT           CHECK (confidence_score BETWEEN 0 AND 100),
    confidence_tier     ai_confidence_tier,
    escalated           BOOLEAN            NOT NULL DEFAULT FALSE,
    tokens_input        INTEGER            NOT NULL DEFAULT 0,
    tokens_output       INTEGER            NOT NULL DEFAULT 0,
    latency_ms          INTEGER,
    prompt_snapshot     JSONB,
    response_snapshot   JSONB,
    owner_rating        SMALLINT           CHECK (owner_rating BETWEEN 1 AND 5),
    created_at          TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

-- 1.6 Deals
CREATE TABLE deals (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id             UUID NOT NULL REFERENCES leads(id) ON DELETE RESTRICT,
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    assigned_to         UUID REFERENCES users(id) ON DELETE SET NULL,
    title               VARCHAR(255)  NOT NULL,
    status              deal_status   NOT NULL DEFAULT 'new',
    amount              NUMERIC(15,2) NOT NULL DEFAULT 0,
    currency            VARCHAR(5)    NOT NULL DEFAULT 'KES',
    notes               TEXT,
    won_reason          TEXT,
    lost_reason         TEXT,
    closed_at           TIMESTAMPTZ,
    expected_close_at   TIMESTAMPTZ,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 1.7 Bookings
CREATE TABLE bookings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id             UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    lead_id             UUID NOT NULL REFERENCES leads(id) ON DELETE RESTRICT,
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    scheduled_at        TIMESTAMPTZ  NOT NULL,
    duration_minutes    SMALLINT     NOT NULL DEFAULT 60,
    status              booking_status NOT NULL DEFAULT 'pending',
    location            TEXT,
    calendar_event_id   VARCHAR(255),
    deposit_amount      NUMERIC(15,2),
    deposit_paid        BOOLEAN      NOT NULL DEFAULT FALSE,
    reminder_sent       BOOLEAN      NOT NULL DEFAULT FALSE,
    notes               TEXT,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 1.8 Payments
CREATE TABLE payments (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id               UUID NOT NULL REFERENCES deals(id) ON DELETE RESTRICT,
    business_id           UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    provider              payment_provider NOT NULL DEFAULT 'mpesa',
    provider_ref          VARCHAR(255),
    checkout_request_id   VARCHAR(255),
    amount                NUMERIC(15,2) NOT NULL,
    currency              VARCHAR(5)    NOT NULL DEFAULT 'KES',
    status                payment_status NOT NULL DEFAULT 'initiated',
    mpesa_phone           VARCHAR(20),
    failure_reason        TEXT,
    retry_count           SMALLINT      NOT NULL DEFAULT 0,
    receipt_url           TEXT,
    paid_at               TIMESTAMPTZ,
    created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 1.9 Transactions (unified financial ledger entry)
CREATE TABLE transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id          UUID REFERENCES payments(id) ON DELETE SET NULL,
    expense_id          UUID,
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    type                transaction_type NOT NULL,
    category_id         UUID,
    amount              NUMERIC(15,2)    NOT NULL,
    currency            VARCHAR(5)       NOT NULL DEFAULT 'KES',
    description         TEXT,
    source              VARCHAR(100),
    reference           VARCHAR(255),
    reconciled          BOOLEAN          NOT NULL DEFAULT FALSE,
    transacted_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- 1.10 Notifications
CREATE TABLE notifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
    type                VARCHAR(100)         NOT NULL,
    channel             notification_channel NOT NULL DEFAULT 'in_app',
    title               VARCHAR(255)         NOT NULL,
    body                TEXT                 NOT NULL,
    read                BOOLEAN              NOT NULL DEFAULT FALSE,
    ref_id              UUID,
    ref_type            VARCHAR(100),
    sent_at             TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
    read_at             TIMESTAMPTZ
);

-- =============================================================
--  MODULE 2 — CRM
-- =============================================================

-- 2.1 Contacts (enriched relationship records, promoted from leads)
CREATE TABLE contacts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    lead_id             UUID REFERENCES leads(id) ON DELETE SET NULL,
    full_name           VARCHAR(255) NOT NULL,
    phone_primary       VARCHAR(20),
    phone_secondary     VARCHAR(20),
    email               VARCHAR(255),
    company             VARCHAR(255),
    job_title           VARCHAR(255),
    contact_type        contact_type   NOT NULL DEFAULT 'lead',
    status              contact_status NOT NULL DEFAULT 'active',
    source_channel      lead_channel,
    assigned_to         UUID REFERENCES users(id) ON DELETE SET NULL,
    avatar_url          TEXT,
    address             TEXT,
    notes               TEXT,
    lifetime_value      NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_deals         INTEGER       NOT NULL DEFAULT 0,
    won_deals           INTEGER       NOT NULL DEFAULT 0,
    last_contacted_at   TIMESTAMPTZ,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 2.2 Tags (shared across contacts, deals, leads)
CREATE TABLE tags (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name                VARCHAR(100) NOT NULL,
    color_hex           VARCHAR(7)   NOT NULL DEFAULT '#1D9E75',
    entity_type         VARCHAR(50)  NOT NULL DEFAULT 'contact',
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (business_id, name, entity_type)
);

-- 2.3 Contact tags (junction)
CREATE TABLE contact_tags (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id          UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    tag_id              UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (contact_id, tag_id)
);

-- 2.4 Pipeline stages (business-configurable)
CREATE TABLE pipeline_stages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name                VARCHAR(100) NOT NULL,
    position            SMALLINT     NOT NULL DEFAULT 0,
    color_hex           VARCHAR(7)   NOT NULL DEFAULT '#1D9E75',
    is_won              BOOLEAN      NOT NULL DEFAULT FALSE,
    is_lost             BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2.5 Pipeline entries (contact's position in a pipeline)
CREATE TABLE pipeline_entries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id          UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    deal_id             UUID REFERENCES deals(id) ON DELETE SET NULL,
    stage_id            UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    title               VARCHAR(255)  NOT NULL,
    value               NUMERIC(15,2) NOT NULL DEFAULT 0,
    currency            VARCHAR(5)    NOT NULL DEFAULT 'KES',
    probability_pct     SMALLINT      NOT NULL DEFAULT 0 CHECK (probability_pct BETWEEN 0 AND 100),
    expected_close_at   TIMESTAMPTZ,
    entered_stage_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 2.6 Activities (communication history timeline)
CREATE TABLE activities (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id          UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    deal_id             UUID REFERENCES deals(id) ON DELETE SET NULL,
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
    type                activity_type  NOT NULL,
    direction           direction_type NOT NULL DEFAULT 'outbound',
    channel             lead_channel,
    summary             TEXT           NOT NULL,
    outcome             VARCHAR(255),
    duration_seconds    INTEGER,
    occurred_at         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- 2.7 Notes
CREATE TABLE notes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id          UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    deal_id             UUID REFERENCES deals(id) ON DELETE SET NULL,
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
    body                TEXT    NOT NULL,
    pinned              BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.8 Tasks
CREATE TABLE tasks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id          UUID REFERENCES contacts(id) ON DELETE CASCADE,
    deal_id             UUID REFERENCES deals(id) ON DELETE SET NULL,
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    assigned_to         UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    title               VARCHAR(255)  NOT NULL,
    description         TEXT,
    priority            task_priority NOT NULL DEFAULT 'medium',
    status              task_status   NOT NULL DEFAULT 'todo',
    due_at              TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 2.9 Reminders (linked to tasks)
CREATE TABLE reminders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id             UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel             notification_channel NOT NULL DEFAULT 'in_app',
    remind_at           TIMESTAMPTZ NOT NULL,
    sent                BOOLEAN     NOT NULL DEFAULT FALSE,
    sent_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.10 Custom field definitions (per business, per entity type)
CREATE TABLE custom_field_definitions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    label               VARCHAR(100) NOT NULL,
    field_type          field_type   NOT NULL DEFAULT 'text',
    entity_type         VARCHAR(50)  NOT NULL DEFAULT 'contact',
    required            BOOLEAN      NOT NULL DEFAULT FALSE,
    options             JSONB,
    position            SMALLINT     NOT NULL DEFAULT 0,
    active              BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2.11 Contact custom field values
CREATE TABLE contact_custom_fields (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id          UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    field_def_id        UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
    value               TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (contact_id, field_def_id)
);

-- =============================================================
--  MODULE 3 — EXPENSE MONITORING
-- =============================================================

-- 3.1 Expense categories (hierarchical, self-referencing)
CREATE TABLE expense_categories (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    parent_id           UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    name                VARCHAR(100) NOT NULL,
    icon                VARCHAR(50)  NOT NULL DEFAULT 'ti-receipt',
    color_hex           VARCHAR(7)   NOT NULL DEFAULT '#1D9E75',
    is_system           BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (business_id, name, parent_id)
);

-- 3.2 Vendors (auto-built from recurring payees)
CREATE TABLE vendors (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    phone               VARCHAR(20),
    email               VARCHAR(255),
    category_id         UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    mpesa_till          VARCHAR(20),
    mpesa_paybill       VARCHAR(20),
    website             TEXT,
    total_paid          NUMERIC(15,2) NOT NULL DEFAULT 0,
    transaction_count   INTEGER       NOT NULL DEFAULT 0,
    last_paid_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 3.3 Recurring expense templates
CREATE TABLE recurring_expense_templates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category_id         UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    vendor_id           UUID REFERENCES vendors(id) ON DELETE SET NULL,
    title               VARCHAR(255)     NOT NULL,
    amount              NUMERIC(15,2)    NOT NULL,
    currency            VARCHAR(5)       NOT NULL DEFAULT 'KES',
    frequency           frequency_type   NOT NULL DEFAULT 'monthly',
    day_of_month        SMALLINT         CHECK (day_of_month BETWEEN 1 AND 31),
    payment_method      payment_provider NOT NULL DEFAULT 'mpesa',
    active              BOOLEAN          NOT NULL DEFAULT TRUE,
    next_due_at         TIMESTAMPTZ      NOT NULL,
    last_generated_at   TIMESTAMPTZ,
    created_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- 3.4 Expenses
CREATE TABLE expenses (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id             UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category_id             UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    user_id                 UUID REFERENCES users(id) ON DELETE SET NULL,
    vendor_id               UUID REFERENCES vendors(id) ON DELETE SET NULL,
    import_batch_id         UUID,
    recurring_template_id   UUID REFERENCES recurring_expense_templates(id) ON DELETE SET NULL,
    title                   VARCHAR(255)     NOT NULL,
    amount                  NUMERIC(15,2)    NOT NULL,
    currency                VARCHAR(5)       NOT NULL DEFAULT 'KES',
    payment_method          payment_provider NOT NULL DEFAULT 'mpesa',
    status                  expense_status   NOT NULL DEFAULT 'draft',
    reference_number        VARCHAR(255),
    receipt_url             TEXT,
    notes                   TEXT,
    is_recurring            BOOLEAN          NOT NULL DEFAULT FALSE,
    reconciled              BOOLEAN          NOT NULL DEFAULT FALSE,
    transaction_id          UUID REFERENCES transactions(id) ON DELETE SET NULL,
    incurred_at             TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    approved_by             UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- 3.5 Budgets
CREATE TABLE budgets (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category_id         UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    name                VARCHAR(255)  NOT NULL,
    period_type         period_type   NOT NULL DEFAULT 'monthly',
    period_year         SMALLINT      NOT NULL,
    period_month        SMALLINT      CHECK (period_month BETWEEN 1 AND 12),
    amount_limit        NUMERIC(15,2) NOT NULL,
    amount_spent        NUMERIC(15,2) NOT NULL DEFAULT 0,
    amount_remaining    NUMERIC(15,2) GENERATED ALWAYS AS (amount_limit - amount_spent) STORED,
    alert_threshold_pct SMALLINT      NOT NULL DEFAULT 80 CHECK (alert_threshold_pct BETWEEN 1 AND 100),
    alert_sent          BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 3.6 Budget alerts
CREATE TABLE budget_alerts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id           UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    alert_type          VARCHAR(50)   NOT NULL,
    spent_at_trigger    NUMERIC(15,2) NOT NULL,
    pct_used            SMALLINT      NOT NULL,
    acknowledged        BOOLEAN       NOT NULL DEFAULT FALSE,
    acknowledged_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    triggered_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 3.7 Import batches (M-Pesa statements, bank CSVs)
CREATE TABLE import_batches (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
    source              import_source  NOT NULL,
    file_name           VARCHAR(255)   NOT NULL,
    file_url            TEXT,
    status              import_status  NOT NULL DEFAULT 'pending',
    total_rows          INTEGER        NOT NULL DEFAULT 0,
    imported_rows       INTEGER        NOT NULL DEFAULT 0,
    skipped_rows        INTEGER        NOT NULL DEFAULT 0,
    error_rows          INTEGER        NOT NULL DEFAULT 0,
    error_log           JSONB          NOT NULL DEFAULT '[]',
    date_range_start    DATE,
    date_range_end      DATE,
    imported_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- 3.8 Imported raw lines (one row per statement line)
CREATE TABLE imported_raw_lines (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id                UUID NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
    business_id             UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    raw_date                VARCHAR(50),
    raw_description         TEXT,
    raw_amount              VARCHAR(50),
    raw_type                VARCHAR(50),
    raw_reference           VARCHAR(255),
    parsed_amount           NUMERIC(15,2),
    parsed_direction        direction_type,
    parsed_date             TIMESTAMPTZ,
    match_status            match_status   NOT NULL DEFAULT 'unmatched',
    matched_expense_id      UUID REFERENCES expenses(id) ON DELETE SET NULL,
    matched_payment_id      UUID REFERENCES payments(id) ON DELETE SET NULL,
    suggested_category_id   UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    confidence_score        SMALLINT       CHECK (confidence_score BETWEEN 0 AND 100),
    rule_applied_id         UUID,
    created_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- 3.9 M-Pesa statements (structured M-Pesa transaction records)
CREATE TABLE mpesa_statements (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    batch_id            UUID NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
    mpesa_transaction_id VARCHAR(50)    NOT NULL,
    receipt_number      VARCHAR(50),
    transaction_type    VARCHAR(100)   NOT NULL,
    party_name          VARCHAR(255),
    party_phone         VARCHAR(20),
    amount              NUMERIC(15,2)  NOT NULL,
    balance_after       NUMERIC(15,2),
    direction           direction_type NOT NULL,
    status              VARCHAR(50)    NOT NULL DEFAULT 'completed',
    transacted_at       TIMESTAMPTZ    NOT NULL,
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    UNIQUE (business_id, mpesa_transaction_id)
);

-- 3.10 Reconciliation rules (auto-categorisation engine)
CREATE TABLE reconciliation_rules (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category_id         UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    name                VARCHAR(255)         NOT NULL,
    match_field         VARCHAR(100)         NOT NULL,
    match_operator      reconcile_operator   NOT NULL DEFAULT 'contains',
    match_value         VARCHAR(255)         NOT NULL,
    auto_approve        BOOLEAN              NOT NULL DEFAULT FALSE,
    priority            SMALLINT             NOT NULL DEFAULT 10,
    active              BOOLEAN              NOT NULL DEFAULT TRUE,
    match_count         INTEGER              NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

-- =============================================================
--  MODULE 4 — FINANCIAL INTELLIGENCE
-- =============================================================

-- 4.1 Financial summaries (pre-computed monthly snapshots)
CREATE TABLE financial_summaries (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id             UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    period_year             SMALLINT      NOT NULL,
    period_month            SMALLINT      NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    total_revenue           NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_expenses          NUMERIC(15,2) NOT NULL DEFAULT 0,
    gross_profit            NUMERIC(15,2) GENERATED ALWAYS AS (total_revenue - total_expenses) STORED,
    cash_in                 NUMERIC(15,2) NOT NULL DEFAULT 0,
    cash_out                NUMERIC(15,2) NOT NULL DEFAULT 0,
    outstanding_receivables NUMERIC(15,2) NOT NULL DEFAULT 0,
    new_leads               INTEGER       NOT NULL DEFAULT 0,
    qualified_leads         INTEGER       NOT NULL DEFAULT 0,
    won_deals               INTEGER       NOT NULL DEFAULT 0,
    lost_deals              INTEGER       NOT NULL DEFAULT 0,
    avg_deal_value          NUMERIC(15,2) NOT NULL DEFAULT 0,
    conversion_rate_pct     NUMERIC(5,2)  NOT NULL DEFAULT 0,
    revenue_by_channel      JSONB         NOT NULL DEFAULT '{}',
    expense_by_category     JSONB         NOT NULL DEFAULT '{}',
    top_customers           JSONB         NOT NULL DEFAULT '[]',
    generated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (business_id, period_year, period_month)
);

-- 4.2 Cash flow forecasts (forward-looking, 90-day rolling)
CREATE TABLE cash_flow_forecasts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    forecast_date       DATE          NOT NULL,
    expected_inflows    NUMERIC(15,2) NOT NULL DEFAULT 0,
    expected_outflows   NUMERIC(15,2) NOT NULL DEFAULT 0,
    projected_balance   NUMERIC(15,2) NOT NULL DEFAULT 0,
    confidence_pct      SMALLINT      CHECK (confidence_pct BETWEEN 0 AND 100),
    notes               TEXT,
    generated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (business_id, forecast_date)
);

-- 4.3 Insight events (AI-generated observations surfaced to dashboard)
CREATE TABLE insight_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    type                VARCHAR(100)  NOT NULL,
    severity            VARCHAR(20)   NOT NULL DEFAULT 'info',
    title               VARCHAR(255)  NOT NULL,
    body                TEXT          NOT NULL,
    ref_id              UUID,
    ref_type            VARCHAR(100),
    acknowledged        BOOLEAN       NOT NULL DEFAULT FALSE,
    acknowledged_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    generated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- =============================================================
--  DEFERRED FOREIGN KEYS (cross-module)
-- =============================================================

ALTER TABLE transactions
    ADD CONSTRAINT fk_transactions_expense
    FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE SET NULL;

ALTER TABLE transactions
    ADD CONSTRAINT fk_transactions_category
    FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE SET NULL;

ALTER TABLE expenses
    ADD CONSTRAINT fk_expenses_import_batch
    FOREIGN KEY (import_batch_id) REFERENCES import_batches(id) ON DELETE SET NULL;

ALTER TABLE imported_raw_lines
    ADD CONSTRAINT fk_raw_lines_rule
    FOREIGN KEY (rule_applied_id) REFERENCES reconciliation_rules(id) ON DELETE SET NULL;

-- =============================================================
--  INDEXES
-- =============================================================

-- Core
CREATE INDEX idx_users_business          ON users(business_id);
CREATE INDEX idx_leads_business          ON leads(business_id);
CREATE INDEX idx_leads_status            ON leads(business_id, status);
CREATE INDEX idx_leads_channel           ON leads(business_id, channel);
CREATE INDEX idx_conversations_lead      ON conversations(lead_id);
CREATE INDEX idx_conversations_business  ON conversations(business_id);
CREATE INDEX idx_ai_sessions_lead        ON ai_sessions(lead_id);
CREATE INDEX idx_deals_business          ON deals(business_id);
CREATE INDEX idx_deals_lead              ON deals(lead_id);
CREATE INDEX idx_deals_status            ON deals(business_id, status);
CREATE INDEX idx_payments_deal           ON payments(deal_id);
CREATE INDEX idx_payments_status         ON payments(business_id, status);
CREATE INDEX idx_payments_checkout_ref   ON payments(checkout_request_id) WHERE checkout_request_id IS NOT NULL;
CREATE INDEX idx_transactions_business   ON transactions(business_id);
CREATE INDEX idx_transactions_type       ON transactions(business_id, type);
CREATE INDEX idx_notifications_user      ON notifications(user_id, read);

-- CRM
CREATE INDEX idx_contacts_business       ON contacts(business_id);
CREATE INDEX idx_contacts_lead           ON contacts(lead_id);
CREATE INDEX idx_contacts_assigned       ON contacts(assigned_to);
CREATE INDEX idx_pipeline_entries_stage  ON pipeline_entries(stage_id);
CREATE INDEX idx_activities_contact      ON activities(contact_id);
CREATE INDEX idx_tasks_assigned          ON tasks(assigned_to);
CREATE INDEX idx_tasks_due               ON tasks(business_id, due_at) WHERE status != 'done';

-- Expense
CREATE INDEX idx_expenses_business       ON expenses(business_id);
CREATE INDEX idx_expenses_category       ON expenses(category_id);
CREATE INDEX idx_expenses_vendor         ON expenses(vendor_id);
CREATE INDEX idx_expenses_incurred       ON expenses(business_id, incurred_at);
CREATE INDEX idx_expenses_status         ON expenses(business_id, status);
CREATE INDEX idx_budgets_business        ON budgets(business_id, period_year, period_month);
CREATE INDEX idx_raw_lines_batch         ON imported_raw_lines(batch_id);
CREATE INDEX idx_raw_lines_status        ON imported_raw_lines(business_id, match_status);
CREATE INDEX idx_mpesa_stmt_business     ON mpesa_statements(business_id);
CREATE INDEX idx_mpesa_stmt_date         ON mpesa_statements(business_id, transacted_at);
CREATE INDEX idx_recon_rules_business    ON reconciliation_rules(business_id, active, priority);

-- Financial Intelligence
CREATE INDEX idx_fin_summary_period      ON financial_summaries(business_id, period_year, period_month);
CREATE INDEX idx_cashflow_date           ON cash_flow_forecasts(business_id, forecast_date);
CREATE INDEX idx_insights_business       ON insight_events(business_id, acknowledged, generated_at);

-- =============================================================
--  TRIGGERS — auto-update updated_at timestamps
-- =============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'businesses','users','leads','deals','bookings','payments',
    'contacts','pipeline_entries','activities','notes','tasks',
    'expenses','budgets','vendors','recurring_expense_templates',
    'reconciliation_rules','custom_field_definitions'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t, t);
  END LOOP;
END;
$$;

-- =============================================================
--  SEED — System expense categories (every new business gets these)
-- =============================================================

CREATE OR REPLACE FUNCTION seed_system_categories(p_business_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  ops_id    UUID := gen_random_uuid();
  mkt_id    UUID := gen_random_uuid();
  hr_id     UUID := gen_random_uuid();
  tech_id   UUID := gen_random_uuid();
  fin_id    UUID := gen_random_uuid();
BEGIN
  INSERT INTO expense_categories (id, business_id, name, icon, color_hex, is_system) VALUES
    (ops_id,  p_business_id, 'Operations',       'ti-building',        '#1D9E75', TRUE),
    (mkt_id,  p_business_id, 'Marketing',         'ti-speakerphone',    '#534AB7', TRUE),
    (hr_id,   p_business_id, 'People & salaries', 'ti-users',           '#D85A30', TRUE),
    (tech_id, p_business_id, 'Technology',        'ti-device-laptop',   '#378ADD', TRUE),
    (fin_id,  p_business_id, 'Finance & legal',   'ti-receipt-2',       '#BA7517', TRUE);

  INSERT INTO expense_categories (business_id, parent_id, name, icon, color_hex, is_system) VALUES
    (p_business_id, ops_id,   'Rent & premises',     'ti-home',           '#1D9E75', TRUE),
    (p_business_id, ops_id,   'Utilities',            'ti-bolt',           '#1D9E75', TRUE),
    (p_business_id, ops_id,   'Transport & fuel',     'ti-car',            '#1D9E75', TRUE),
    (p_business_id, ops_id,   'Supplies & materials', 'ti-package',        '#1D9E75', TRUE),
    (p_business_id, mkt_id,   'Social media ads',     'ti-ad-2',           '#534AB7', TRUE),
    (p_business_id, mkt_id,   'Printing & branding',  'ti-printer',        '#534AB7', TRUE),
    (p_business_id, hr_id,    'Staff salaries',        'ti-cash',           '#D85A30', TRUE),
    (p_business_id, hr_id,    'Casual labour',         'ti-user-plus',      '#D85A30', TRUE),
    (p_business_id, tech_id,  'SaaS subscriptions',   'ti-cloud',          '#378ADD', TRUE),
    (p_business_id, tech_id,  'Airtime & data',        'ti-device-mobile',  '#378ADD', TRUE),
    (p_business_id, fin_id,   'Bank charges',          'ti-building-bank',  '#BA7517', TRUE),
    (p_business_id, fin_id,   'Legal & compliance',    'ti-scale',          '#BA7517', TRUE);
END;
$$;

-- =============================================================
--  SEED — Default pipeline stages for new businesses
-- =============================================================

CREATE OR REPLACE FUNCTION seed_pipeline_stages(p_business_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO pipeline_stages (business_id, name, position, color_hex, is_won, is_lost) VALUES
    (p_business_id, 'New enquiry',   1, '#888780', FALSE, FALSE),
    (p_business_id, 'Contacted',     2, '#378ADD', FALSE, FALSE),
    (p_business_id, 'Qualified',     3, '#534AB7', FALSE, FALSE),
    (p_business_id, 'Proposal sent', 4, '#BA7517', FALSE, FALSE),
    (p_business_id, 'Negotiating',   5, '#D85A30', FALSE, FALSE),
    (p_business_id, 'Won',           6, '#1D9E75', TRUE,  FALSE),
    (p_business_id, 'Lost',          7, '#E24B4A', FALSE, TRUE);
END;
$$;

-- =============================================================
--  ROW-LEVEL SECURITY (enable per table — policies defined at app layer)
-- =============================================================

ALTER TABLE businesses               ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_summaries      ENABLE ROW LEVEL SECURITY;

-- Migration: add description and products columns to businesses (industry context for AI)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='businesses' AND column_name='description') THEN
    ALTER TABLE businesses ADD COLUMN description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='businesses' AND column_name='products') THEN
    ALTER TABLE businesses ADD COLUMN products TEXT;
  END IF;
END;
$$;

-- 8.x Business Knowledge Base (business feeds their info for AI context)
CREATE TABLE business_knowledge (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    title               VARCHAR(255) NOT NULL,
    content             TEXT NOT NULL,
    keywords            TEXT[] DEFAULT '{}',
    category            VARCHAR(100) DEFAULT 'general',
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    file_url            TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE business_knowledge ENABLE ROW LEVEL SECURITY;

-- End of LeadAI complete schema
