create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  placed_at timestamptz not null,
  ask_price numeric(14, 4) not null check (ask_price >= 0),
  original_quantity numeric(14, 4) not null check (original_quantity >= 0),
  estimated_filled_quantity numeric(14, 4) not null default 0 check (estimated_filled_quantity >= 0),
  predicted_filled_quantity numeric(14, 4) not null default 0 check (predicted_filled_quantity >= 0),
  remaining_quantity numeric(14, 4) not null check (remaining_quantity >= 0),
  status text not null check (status in ('open', 'partial', 'closed')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_snapshots (
  id uuid primary key default gen_random_uuid(),
  captured_at timestamptz not null,
  item_key text not null,
  best_buy_price numeric(14, 4) not null,
  best_sell_price numeric(14, 4) not null,
  buy_volume numeric(14, 4),
  sell_volume numeric(14, 4),
  top_buy_summary jsonb,
  top_sell_summary jsonb,
  raw_payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.order_fill_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  snapshot_id uuid references public.market_snapshots(id) on delete set null,
  event_type text not null,
  quantity_delta numeric(14, 4) not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  notification_type text not null,
  message text not null,
  triggered_at timestamptz not null default now()
);

create unique index if not exists notifications_order_type_key
  on public.notifications (order_id, notification_type);

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_placed_at_idx on public.orders (placed_at desc);
create index if not exists market_snapshots_captured_at_idx on public.market_snapshots (captured_at desc);
create index if not exists order_fill_events_order_id_idx on public.order_fill_events (order_id);

alter table public.orders enable row level security;
alter table public.market_snapshots enable row level security;
alter table public.order_fill_events enable row level security;
alter table public.notifications enable row level security;

create policy "public read orders"
  on public.orders
  for select
  to anon, authenticated
  using (true);

create policy "public write orders"
  on public.orders
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "public read market snapshots"
  on public.market_snapshots
  for select
  to anon, authenticated
  using (true);

create policy "public read fill events"
  on public.order_fill_events
  for select
  to anon, authenticated
  using (true);

create policy "public read notifications"
  on public.notifications
  for select
  to anon, authenticated
  using (true);
