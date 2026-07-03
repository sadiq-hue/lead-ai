-- =============================================================
--  LeadAI — NSE Stock Financial Statements Module
--  Migration: Add stock registry, PDF uploads, and fundamentals
-- =============================================================

-- ENUMS for stock module (create only if they don't exist)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statement_status') THEN
    CREATE TYPE statement_status AS ENUM ('uploaded', 'processing', 'completed', 'failed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'period_type_enum') THEN
    CREATE TYPE period_type_enum AS ENUM ('quarterly', 'half_yearly', 'annual');
  END IF;
END $$;

-- =============================================================
--  5.1 NSE Stock Registry
-- =============================================================
CREATE TABLE IF NOT EXISTS nse_stocks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker          VARCHAR(10) NOT NULL UNIQUE,
    company_name    VARCHAR(255) NOT NULL,
    sector          VARCHAR(100),
    market_cap      NUMERIC(18,2),
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
--  5.2 Financial Statement Uploads (raw PDFs)
-- =============================================================
CREATE TABLE IF NOT EXISTS financial_statements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_id        UUID NOT NULL REFERENCES nse_stocks(id) ON DELETE CASCADE,
    file_url        TEXT,
    file_name       VARCHAR(255) NOT NULL,
    file_data       BYTEA,
    period_type     period_type_enum NOT NULL DEFAULT 'annual',
    fiscal_year     SMALLINT NOT NULL,
    period          VARCHAR(10),
    status          statement_status NOT NULL DEFAULT 'uploaded',
    raw_text        TEXT,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add file_data column if upgrading existing table
ALTER TABLE financial_statements ADD COLUMN IF NOT EXISTS file_data BYTEA;

-- =============================================================
--  5.3 Stock Fundamentals (normalized extracted data)
-- =============================================================
CREATE TABLE IF NOT EXISTS stock_fundamentals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_id        UUID NOT NULL REFERENCES nse_stocks(id) ON DELETE CASCADE,
    statement_id    UUID NOT NULL REFERENCES financial_statements(id) ON DELETE CASCADE,
    revenue         NUMERIC(18,2),
    net_profit      NUMERIC(18,2),
    eps             NUMERIC(10,2),
    dps             NUMERIC(10,2),
    total_assets    NUMERIC(18,2),
    total_liabilities NUMERIC(18,2),
    book_value      NUMERIC(10,2),
    pe_ratio        NUMERIC(10,2),
    fiscal_year     SMALLINT NOT NULL,
    period          VARCHAR(10),
    extracted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (stock_id, statement_id)
);

-- =============================================================
--  INDEXES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_nse_stocks_ticker ON nse_stocks(ticker);
CREATE INDEX IF NOT EXISTS idx_fin_stmts_stock ON financial_statements(stock_id);
CREATE INDEX IF NOT EXISTS idx_fin_stmts_status ON financial_statements(status);
CREATE INDEX IF NOT EXISTS idx_stock_fund_stock ON stock_fundamentals(stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_fund_period ON stock_fundamentals(stock_id, fiscal_year, period);

-- =============================================================
--  TRIGGERS — auto-update updated_at
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
  FOREACH t IN ARRAY ARRAY['nse_stocks', 'financial_statements']
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_' || t || '_updated_at') THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%s_updated_at
         BEFORE UPDATE ON %s
         FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t, t);
    END IF;
  END LOOP;
END;
$$;

-- =============================================================
--  SEED — Popular NSE Kenya stocks
-- =============================================================
INSERT INTO nse_stocks (ticker, company_name, sector) VALUES
  ('SCOM',  'Safaricom PLC',                    'Telecommunications'),
  ('EQTY',  'Equity Group Holdings PLC',         'Banking'),
  ('KCB',   'KCB Group PLC',                     'Banking'),
  ('COOP',  'Co-operative Bank of Kenya PLC',    'Banking'),
  ('ABSA',  'Absa Bank Kenya PLC',               'Banking'),
  ('STAN',  'Stanbic Holdings PLC',              'Banking'),
  ('DTK',   'Diamond Trust Bank Kenya PLC',      'Banking'),
  ('I&M',   'I&M Holdings PLC',                  'Banking'),
  ('NCBA',  'NCBA Group PLC',                    'Banking'),
  ('BRCH',  'Britam Holdings PLC',               'Insurance'),
  ('JUBP',  'Jubilee Holdings PLC',              'Insurance'),
  ('CIC',   'CIC Insurance Group PLC',           'Insurance'),
  ('TPET',  'TotalEnergies Marketing Kenya PLC', 'Energy'),
  ('EAPC',  'East African Portland Cement PLC',  'Manufacturing'),
  ('KEGN',  'KenGen PLC',                        'Energy'),
  ('KPLC',  'Kenya Power & Lighting Company',    'Energy'),
  ('EABL',  'East African Breweries PLC',        'Manufacturing'),
  ('BAT',   'British American Tobacco Kenya',    'Manufacturing'),
  ('LBTY',  'Liberty Kenya Holdings PLC',        'Insurance'),
  ('SAF',   'Safaricom PLC (alt)',               'Technology')
ON CONFLICT (ticker) DO NOTHING;
