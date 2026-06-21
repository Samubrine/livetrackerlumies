## Sea Lumies Live Tracker Design

Date: 2026-06-21
Status: Approved for spec drafting
Scope: v1 design for a shared live Hypixel SkyBlock Sea Lumies tracker hosted on Vercel and backed by Supabase

### 1. Product Goal

Build a live shared website for tracking Sea Lumies sell orders and the resulting realized, unrealized, and opportunity-loss style PnL using public Hypixel Bazaar market data.

The site is not a personal portfolio tracker. It is a single global shared ledger for one item only: Sea Lumies. Any visitor can add and modify order records. The app emphasizes the cost of waiting on a sell offer while the market buy side weakens.

### 2. v1 Scope

The v1 product includes:

- A single global Sea Lumies order book shared by all visitors
- Anonymous add/edit behavior with no auth or anti-abuse controls in v1
- Order lifecycle states: `open`, `partial`, `closed`
- Public-data-based fill inference using Hypixel Bazaar data
- Headline metrics for realized PnL, unrealized PnL, and predicted fills
- Opportunity-loss framing using the best buy price as the reference baseline
- A live chart with selectable windows from `30s` through `1w`
- In-browser live notifications only
- Raw market snapshot persistence and derived chart bucketing

The v1 product does not include:

- Per-user accounts
- Private rooms or multiple shared sessions
- Multi-item support
- Exact guaranteed 15-second ingestion timing
- Push notifications, email, Discord, or Telegram delivery
- ML-driven price baseline or advanced mid-price modeling

### 3. Product Model

This app tracks listing performance, not only classic trade profit.

Core idea:

- A visitor lists Sea Lumies at an ask price
- The market may have demand at a lower best buy price
- If the visitor waits on the ask and the market falls, the remaining inventory loses value
- The app quantifies this using current and historical best buy prices

For v1, the primary reference baseline is the live and historical `best_buy_price`.

Future v2 note:

- Add a `mid-price baseline` using quantitative or ML analysis

### 4. Recommended Architecture

Use a Supabase-first architecture with Next.js hosted on Vercel.

Components:

- `Next.js app`: UI, chart rendering, order entry/edit flows, server routes for reads/writes that need validation
- `Supabase Postgres`: source of truth for orders, snapshots, derived states, notifications, and audit-friendly fill events
- `Supabase Realtime`: broadcast updates to all connected visitors for orders, metrics, and notifications
- `Ingestion job`: server-side recurring job that fetches Hypixel Bazaar data for Sea Lumies on a best-effort 15-second cadence
- `Metric derivation layer`: SQL views, stored procedures, or app-side server logic that recalculates current order state from snapshots and order records

This is preferred over a dedicated worker for v1 because it matches the intended stack and keeps deployment simple while preserving a path to a more precise long-running ingestor in v2.

### 5. Data Flow

#### 5.1 Market ingestion

1. A server-side job fetches Hypixel Bazaar data for Sea Lumies every 15 seconds on a best-effort basis
2. The raw relevant market fields are stored as a snapshot row
3. After the snapshot write succeeds, metric recalculation runs for affected open and partial orders
4. Derived aggregate state is updated or exposed through views
5. Realtime subscribers receive updated state

#### 5.2 Visitor order flow

1. A visitor creates or edits a shared sell order record
2. The order is stored in the shared global ledger
3. Recalculation runs immediately using the latest snapshot context
4. Updated order state and aggregate PnL are published to all connected visitors

#### 5.3 Notification flow

1. A recalculation pass identifies whether market conditions imply that a tracked order has been outbid or materially worsened
2. The system checks notification history to prevent duplicate alerts for the same order and alert type
3. A notification row is inserted if no prior alert exists
4. Connected clients receive the alert in-app via Realtime

### 6. Data Model

Field names are indicative and can be refined during implementation, but the entities and responsibilities should remain stable.

#### 6.1 `orders`

Purpose: shared visitor-entered sell order ledger.

Suggested fields:

- `id`
- `placed_at`
- `ask_price`
- `original_quantity`
- `estimated_filled_quantity`
- `predicted_filled_quantity`
- `remaining_quantity`
- `status` (`open`, `partial`, `closed`)
- `note` nullable
- `created_at`
- `updated_at`

Behavior notes:

- All visitors may create and edit rows in v1
- `remaining_quantity` should be derived or kept synchronized from original minus estimated filled quantity
- `predicted_filled_quantity` is advisory and must not be used as realized PnL input

#### 6.2 `market_snapshots`

Purpose: append-only raw Sea Lumies market history.

Suggested fields:

- `id`
- `captured_at`
- `product_id` or constant item key for Sea Lumies
- `best_buy_price`
- `best_sell_price`
- `buy_volume`
- `sell_volume`
- `top_buy_summary` or equivalent normalized queue/volume fields needed for inference
- `top_sell_summary` if useful for charting and later diagnostics
- `raw_payload` JSONB
- `created_at`

Behavior notes:

- This table is the source for all chart timeframes
- Rows should never be overwritten

#### 6.3 `order_fill_events`

Purpose: audit-friendly append-only history of inferred fill changes.

Suggested fields:

- `id`
- `order_id`
- `snapshot_id`
- `event_type` such as `confirmed_fill_increment`, `predicted_fill_update`, `status_change`
- `quantity_delta`
- `reason`
- `created_at`

Behavior notes:

- This prevents realized state from becoming opaque
- Confirmed and predicted changes should be distinguishable

#### 6.4 `notifications`

Purpose: one-time in-app alerts for order conditions.

Suggested fields:

- `id`
- `order_id`
- `notification_type`
- `message`
- `triggered_at`
- `seen_state` or a client-side equivalent if needed later

Behavior notes:

- Add a uniqueness rule that prevents duplicate alerts of the same type for the same order

#### 6.5 Derived views or materialized state

Purpose: fast reads for homepage cards, live summaries, and charts.

Possible outputs:

- Current aggregate realized PnL
- Current aggregate unrealized PnL
- Current aggregate predicted fill quantity
- Active ask distribution
- Open and partial order counts

Implementation can use SQL views first and materialization only if performance requires it.

### 7. Metric Definitions

#### 7.1 Realized PnL

Realized PnL is based only on `confirmed inferred fills`.

Rules:

- Predicted fills must not contribute to realized PnL
- Confirmed fills should be tied to market evidence from snapshots
- Realized PnL uses the order's ask price compared against the best buy baseline model chosen for v1

#### 7.2 Unrealized PnL

Unrealized PnL is based on remaining open quantity repriced against the current `best_buy_price`.

Rules:

- Applies only to open or partial orders with remaining quantity
- Updates whenever a new market snapshot arrives or order size changes

#### 7.3 Predicted fills

Predicted fills are a separate advisory metric.

Rules:

- Use queue and visible volume behavior at the active price level
- Surface as a distinct number and visual layer
- Never merge into realized PnL

#### 7.4 Opportunity loss

Opportunity loss is the product interpretation layer that explains why waiting on the ask can be costly.

Rules:

- Compare order outcome or current open state against the best buy side over time
- Phrase clearly in the UI so users understand this is a market-relative performance metric, not personal accounting profit

### 8. Fill Inference Model

The fill system has two confidence tiers.

#### 8.1 Confirmed fill estimate

Use this when market movement strongly implies that quantity at the tracked ask price has already sold.

For v1, the working rule is:

- If the live best sell price moves beyond a tracked order level in a way that implies lower-priced inventory has cleared, count relevant quantity as confirmed filled

Exact heuristics will be implementation-specific, but the system must keep the logic explicit and explainable.

#### 8.2 Probabilistic fill estimate

Use this when the tracked order still appears to sit at the current level and fill likelihood must be inferred from visible volume dynamics.

For v1:

- Use simple regression or trend heuristics based on queue/volume decay at the current active level
- Label all outputs as predicted or estimated

### 9. Charting

The main chart should combine market context and session performance.

Default plotted series:

- `best_buy_price`
- shared active ask levels
- aggregate realized PnL
- aggregate unrealized PnL
- predicted fill quantity

Supported windows:

- `30s`
- `1m`
- `5m`
- `15m`
- `1h`
- `3h`
- `6h`
- `12h`
- `1d`
- `3d`
- `1w`

Storage and query rules:

- Persist raw snapshots only in v1
- Derive chart buckets at query time
- Downsample according to requested timeframe
- Keep enough resolution for near-live windows while avoiding heavy client payloads for longer ranges

### 10. Notifications

v1 notification scope is intentionally narrow.

Rules:

- Notifications are in-browser only
- They are delivered as live session alerts through the app UI
- Each tracked sell order should emit at most one outbid-style alert per defined condition type
- Duplicate notification prevention must be enforced in storage, not only in the client

### 11. Homepage Experience

The homepage should behave like a shared live trading room for Sea Lumies.

Primary sections:

- Headline live metrics
- Shared order entry and edit controls
- Shared order table with status and inferred fill state
- Notification feed
- Live chart

Expected behavior:

- Any visitor sees and edits the same shared state
- Realtime updates appear without refresh
- Metric wording should clearly distinguish confirmed versus predicted values

### 12. Error Handling And Reliability

#### 12.1 Ingestion errors

- If a fetch from Hypixel fails, the app should preserve the previous live state and mark the last update age clearly
- Failed polls should not delete or corrupt prior data
- Repeated failures should be observable in logs

#### 12.2 Recalculation safety

- Metric recalculation should be idempotent
- Duplicate snapshot processing should not double-count fills
- Confirmed fill increments should be append-only or otherwise safely deduplicated

#### 12.3 UI clarity

- Where the system is estimating rather than knowing, use explicit labels such as `estimated`, `predicted`, or `confirmed by market movement`

### 13. Testing Strategy

v1 implementation should include tests for:

- Order lifecycle transitions: `open -> partial -> closed`
- Snapshot ingestion parsing and persistence
- Confirmed fill inference edge cases
- Predicted fill calculation boundaries
- Realized versus unrealized PnL separation
- Duplicate notification prevention
- Chart bucket derivation across supported windows

Testing should especially protect against accidental mixing of predicted fills into realized PnL.

### 14. Performance Notes

- Raw snapshots are preferred for flexibility, but queries over 1-week windows must be bounded and bucketed efficiently
- Favor server-side aggregation for chart payloads
- Add indexes around `captured_at`, `order_id`, `status`, and notification uniqueness keys

### 15. v2 Roadmap

Planned next-step ideas already identified during design:

- Mid-price baseline using quantitative or ML analysis
- More advanced fill modeling beyond simple queue regression
- Dedicated ingestion worker for tighter cadence and better control
- Optional audit/provenance improvements or moderation controls if the product becomes more widely shared

### 16. Final Decisions Locked For v1

- Single global ledger for Sea Lumies only
- No auth in v1
- Any visitor can add and edit records
- Order lifecycle is `open`, `partial`, `closed`
- Use best buy price as the reference baseline
- Keep strict realized/unrealized metrics and show prediction separately
- Poll Hypixel on a best-effort 15-second cadence
- Store raw snapshots and derive chart buckets at query time
- Deliver notifications only inside the app

### 17. Open Implementation Questions To Resolve In Planning

These are not product ambiguities, but implementation details that will need concrete choices in the next step:

- Exact Hypixel Bazaar fields available for Sea Lumies inference
- Whether recalculation is implemented primarily in SQL, Edge Functions, or Next.js server routes
- Exact uniqueness constraints and indexes for notifications and fill events
- Final UI layout and component hierarchy for the homepage
