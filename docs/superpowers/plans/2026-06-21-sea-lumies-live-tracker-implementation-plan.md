## Sea Lumies Live Tracker Implementation Plan

Date: 2026-06-21
Based on: `docs/superpowers/specs/2026-06-21-sea-lumies-live-tracker-design.md`
Goal: deliver a v1 shared Sea Lumies live tracker on Vercel + Supabase with raw snapshot ingestion, inferred fills, live charting, and in-browser notifications.

### 1. Delivery Strategy

Build in thin vertical slices so the app becomes usable early:

1. Scaffold the app and deployable stack
2. Stand up Supabase schema and local type generation
3. Implement Hypixel ingestion and snapshot storage
4. Implement shared orders and realtime sync
5. Implement metric derivation and fill inference
6. Render dashboard cards, chart, and order table
7. Add notifications and harden edge cases
8. Test and prepare for Vercel deployment

The first milestone should already show live market data and a shared order table, even before the full PnL engine is complete.

### 2. Recommended Stack Decisions

- `Next.js 15+` with App Router and TypeScript
- `Supabase` for Postgres, Realtime, and generated database types
- `Vercel` for hosting and scheduled server-side ingestion entrypoints
- `Tailwind CSS` for UI implementation speed
- `shadcn/ui` or lightweight hand-rolled components for cards, tables, dialogs, and alerts
- `Recharts` or `visx` for charting; prefer `Recharts` for faster v1 delivery
- `Zod` for validating order input and environment variables
- `date-fns` for bucket derivation and display formatting

### 3. Proposed Project Structure

```text
app/
  api/
    ingest/route.ts
    orders/route.ts
    orders/[id]/route.ts
    metrics/route.ts
    chart/route.ts
  globals.css
  layout.tsx
  page.tsx
components/
  dashboard/
    headline-cards.tsx
    market-status.tsx
    pnl-chart.tsx
    notifications-feed.tsx
    orders-table.tsx
    order-form.tsx
  ui/
lib/
  env.ts
  supabase/
    client.ts
    server.ts
    admin.ts
  hypixel/
    client.ts
    parser.ts
  metrics/
    fill-inference.ts
    pnl.ts
    chart-buckets.ts
    notifications.ts
  db/
    queries.ts
    mutations.ts
  types/
    domain.ts
supabase/
  migrations/
  seed.sql
  functions/ (optional later)
docs/
  superpowers/
    specs/
    plans/
```

### 4. Build Phases

#### Phase 1: Scaffold and environment

Objective: create a running Next.js app connected to Supabase.

Tasks:

- Create a new Next.js App Router project with TypeScript and Tailwind
- Add Supabase client dependencies
- Add environment validation for Supabase URL, anon key, service role key, and Hypixel API settings if needed
- Add a shared layout shell for the future dashboard
- Set up a `.env.example`

Exit criteria:

- App boots locally
- Environment variables are validated at startup
- Supabase client can be initialized in server and browser contexts

#### Phase 2: Database schema and types

Objective: establish the data model from the approved spec.

Tasks:

- Create migrations for `orders`, `market_snapshots`, `order_fill_events`, and `notifications`
- Add indexes for `captured_at`, `status`, `order_id`, and notification uniqueness
- Add views for current aggregate metrics if helpful in v1
- Generate TypeScript database types from Supabase schema

Exit criteria:

- Schema is reproducible from migrations
- Types are available in the app
- Notification uniqueness is enforced in the database

#### Phase 3: Hypixel ingestion

Objective: persist raw Sea Lumies snapshots every polling cycle.

Tasks:

- Implement Hypixel Bazaar fetch client
- Confirm exact product identifier and available fields for Sea Lumies
- Parse only the fields needed for v1 metrics while storing the full raw payload
- Create an ingestion route or server function invoked by Vercel cron
- Ensure writes are idempotent enough to avoid accidental duplicate snapshot handling

Exit criteria:

- Manual invocation stores a valid snapshot row
- Errors are logged clearly and do not corrupt prior state
- Snapshot rows can be queried in chronological order

#### Phase 4: Shared orders CRUD

Objective: allow any visitor to create and update shared sell orders.

Tasks:

- Implement order creation API with Zod validation
- Implement edit/update API for quantity, ask price, status, and note
- Decide which fields are editable after partial fill and encode that policy consistently
- Build a simple shared order form and table
- Subscribe the UI to orders via Supabase Realtime

Exit criteria:

- Visitors can add and edit orders without auth
- All connected clients see updates quickly
- Order lifecycle supports `open`, `partial`, `closed`

#### Phase 5: Fill inference and PnL engine

Objective: turn snapshots and order rows into reliable current metrics.

Tasks:

- Implement confirmed fill inference based on market movement past tracked ask levels
- Implement predicted fill estimation from queue and volume behavior at current levels
- Compute remaining quantity, estimated filled quantity, and predicted filled quantity
- Compute aggregate realized PnL and unrealized PnL using the best buy baseline
- Record append-only `order_fill_events`

Implementation note:

- Keep the inference logic in pure TypeScript first unless SQL clearly simplifies it; this improves testability for a math-heavy first version.

Exit criteria:

- Metrics recalculate deterministically from a known snapshot series
- Predicted fills never affect realized PnL
- Fill event history explains state changes

#### Phase 6: Dashboard UI and charting

Objective: present the live state clearly.

Tasks:

- Build headline cards for realized PnL, unrealized PnL, predicted fills, and last market update age
- Build the live order table with status badges and fill breakdowns
- Build a combined chart for best buy price, active ask levels, realized/unrealized PnL, and predicted fills
- Add timeframe controls for all approved windows
- Implement chart bucket derivation from raw snapshots

Exit criteria:

- Dashboard is usable on desktop and mobile
- Timeframe switching is fast and stable
- UI language clearly distinguishes confirmed versus predicted values

#### Phase 7: Notifications

Objective: surface live in-app alerts without duplication.

Tasks:

- Define concrete notification condition types for v1, such as outbid or materially worsened
- Insert notification rows during recalculation when conditions are first met
- Subscribe clients to notification inserts
- Render a live feed and transient toast-style alerts

Exit criteria:

- Notifications appear live in-browser
- The same order-condition pair does not alert more than once

#### Phase 8: Testing and deployment hardening

Objective: make the app safe to ship.

Tasks:

- Add unit tests for parser, fill inference, PnL math, and chart bucket derivation
- Add integration tests for order CRUD and ingestion route behavior where practical
- Add empty/error/loading states in the UI
- Verify cron invocation and production environment configuration on Vercel
- Confirm Supabase Realtime and row security strategy for anonymous shared editing

Exit criteria:

- Core metric logic is covered by tests
- Production env vars are documented
- Deployment path is clear and repeatable

### 5. Schema Outline

#### `orders`

- `id uuid primary key`
- `placed_at timestamptz not null`
- `ask_price numeric not null`
- `original_quantity numeric not null`
- `estimated_filled_quantity numeric not null default 0`
- `predicted_filled_quantity numeric not null default 0`
- `remaining_quantity numeric not null`
- `status text not null`
- `note text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

#### `market_snapshots`

- `id uuid primary key`
- `captured_at timestamptz not null`
- `item_key text not null`
- `best_buy_price numeric not null`
- `best_sell_price numeric not null`
- `buy_volume numeric null`
- `sell_volume numeric null`
- `top_buy_summary jsonb null`
- `top_sell_summary jsonb null`
- `raw_payload jsonb not null`
- `created_at timestamptz not null default now()`

#### `order_fill_events`

- `id uuid primary key`
- `order_id uuid not null references orders(id)`
- `snapshot_id uuid null references market_snapshots(id)`
- `event_type text not null`
- `quantity_delta numeric not null`
- `reason text not null`
- `created_at timestamptz not null default now()`

#### `notifications`

- `id uuid primary key`
- `order_id uuid not null references orders(id)`
- `notification_type text not null`
- `message text not null`
- `triggered_at timestamptz not null default now()`

Unique index recommendation:

- `(order_id, notification_type)` for one-time v1 alerts

### 6. API and Server Surface

Recommended initial endpoints:

- `POST /api/ingest` - fetch and store the latest Sea Lumies snapshot, then trigger recalculation
- `GET /api/chart?range=1h` - return bucketed chart series for selected timeframe
- `GET /api/metrics` - return current aggregate cards and market status
- `POST /api/orders` - create a shared order
- `PATCH /api/orders/:id` - update ask price, quantity, status, or note

If the app remains simple, these endpoints can call library functions directly instead of introducing an additional service layer.

### 7. Recalculation Strategy

Use a single deterministic recalculation pipeline:

1. Load latest relevant snapshot
2. Load open and partial orders
3. Recompute confirmed fill estimates
4. Recompute predicted fill estimates
5. Update order state and append fill events where changes occurred
6. Compute aggregate metrics
7. Insert first-time notifications

This pipeline should be callable both after ingestion and after manual order edits so the system stays consistent.

### 8. Testing Plan

Priority tests:

- Hypixel payload parsing for Sea Lumies
- Confirmed fill inference when best sell moves through tracked asks
- No realized PnL contribution from predicted fills
- Partial-to-closed transitions when remaining quantity reaches zero
- Notification deduplication
- Chart bucket generation for each timeframe option

### 9. Deployment Notes

- Vercel hosts the Next.js app
- Supabase integration supplies project credentials
- Vercel cron or scheduled invocation hits `/api/ingest`
- Use service-role access only on trusted server-side paths
- Anonymous client writes should be constrained carefully with RLS or routed through server endpoints, even if the app is intentionally trust-based

### 10. Recommended Immediate Next Step

Start with Phases 1 and 2 together:

- scaffold the Next.js app
- connect Supabase
- create the initial schema
- generate types

Reason: this unlocks all later work, keeps the stack real early, and lets the ingestion and dashboard work against actual tables instead of temporary mocks.
