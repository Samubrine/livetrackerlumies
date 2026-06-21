alter table public.market_snapshots
  add column if not exists source_last_updated bigint,
  add column if not exists moving_week numeric(14, 4),
  add column if not exists buy_orders integer,
  add column if not exists sell_orders integer,
  add column if not exists product_id text;

create index if not exists market_snapshots_source_last_updated_idx
  on public.market_snapshots (source_last_updated desc);
