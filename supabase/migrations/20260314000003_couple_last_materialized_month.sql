-- Add last_materialized_month column to couples table
-- Format: 'YYYY-MM' (e.g., '2026-03'), null if fixed expenses haven't been processed yet
alter table couples
  add column if not exists last_materialized_month text;
