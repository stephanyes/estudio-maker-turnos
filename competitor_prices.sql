-- Competitor pricing storage and scrape run auditing
-- Safe to run multiple times if guarded by IF NOT EXISTS

-- Sources enum simulated with CHECK until a dedicated type is created
CREATE TABLE IF NOT EXISTS public.competitor_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL CHECK (source IN ('cerini','mala')),
    service_name TEXT NOT NULL,
    category TEXT NOT NULL,                -- e.g., corte, color, cauterizacion, otros
    price NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'ARS',
    observations TEXT,
    content_hash TEXT,                     -- hash of raw source content used for change detection
    captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Avoid duplicates on same source+service in the same scrape window (hour granularity)
CREATE INDEX IF NOT EXISTS idx_competitor_prices_source_captured_at
    ON public.competitor_prices (source, captured_at DESC);

-- Optional partial unique if you insert only once per hash
CREATE UNIQUE INDEX IF NOT EXISTS uniq_competitor_prices_source_name_hash
    ON public.competitor_prices (source, service_name, coalesce(content_hash, ''));

-- Scrape runs: for locking, auditing, backoff and status reporting
CREATE TABLE IF NOT EXISTS public.scrape_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL CHECK (source IN ('cerini','mala')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'running', -- running | success | failed | skipped
    error TEXT,
    lock_expires_at TIMESTAMPTZ,            -- to prevent concurrent scrapes
    attempts INTEGER NOT NULL DEFAULT 1,
    result JSONB DEFAULT '{}'::jsonb        -- counts, inserted, skipped, etc.
);

CREATE INDEX IF NOT EXISTS idx_scrape_runs_source_started
    ON public.scrape_runs (source, started_at DESC);


