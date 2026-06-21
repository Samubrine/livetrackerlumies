# Full Analysis + Fix — Sea Lumies Live Tracker

## Summary

This is a Next.js 16.2.9 / Supabase / Hypixel Bazaar tracking dashboard for ENCHANTED SEA LUMIE sell orders. The codebase is small (38 source files), clean (no TODO/FIXME/HACK, no console.log), and well-structured. However, there are several bugs — one critical — plus security gaps and code-quality nits.

---

## Critical Bug

### 1. Wrong condition for confirmed full fill

**File:** `src/lib/metrics/recalculate.ts:116`
**Code:** `if (snapshot.best_sell_price > order.ask_price && remainingQuantity > 0)`
**Should be:** `if (snapshot.best_buy_price >= order.ask_price && remainingQuantity > 0)`

**Why it's wrong:** In Hypixel Bazaar, `buyPrice` = highest price a buyer offers (best bid), `sellPrice` = lowest price a seller asks (best ask). A sell order at `ask_price` fills when a buyer is willing to pay ≥ ask_price — i.e., `best_buy_price >= ask_price`. Checking `best_sell_price > ask_price` means "the cheapest sell offer is above our ask" which just means our order is competitive — it does NOT mean it filled. This causes the engine to prematurely close orders and mark huge quantities as filled when it shouldn't.

---

## Other Issues

### 2. `/api/refresh` has no authorization (security)
`src/app/api/refresh/route.ts` calls `runIngest()` with zero auth checks. `/api/ingest` has proper auth. `/api/refresh` is open to anyone who can POST, enabling free Hypixel API calls and DB writes. Should use the same `isAuthorized` check.

### 3. Chart PnL calculation uses average ask price × total quantity (wrong)
`src/lib/dashboard.ts:129-151` — `buildChartPoints` computes `activeAskPrice` as the average of active orders' ask prices, then multiplies ALL confirmed fill quantity by it. This produces meaningless PnL numbers. Should compute per-order PnL and sum: for each order, `estimated_filled_quantity * (order.ask_price - snapshot.best_buy_price)`.

### 4. `/api/ingest` serves on GET (side-effect on GET)
Mutation endpoint accepts both GET and POST. GET requests should be idempotent.

### 5. `formatPlacedAt` fragile comma replacement
`src/lib/formatters.ts:79` — `.replace(",", "")` strips only the first comma. DateTimeFormat always puts a comma between date and time — use `formatToParts` instead.

### 6. `normalizeUpdateOrder` double-calls `deriveStatus`
`src/lib/orders/normalize.ts:33,36` derives status twice with the same arguments.

---

## Work Units

| # | Unit | Files | Change |
|---|------|-------|--------|
| 1 | Fix confirmed-fill condition | `src/lib/metrics/recalculate.ts` | Change `best_sell_price > ask_price` to `best_buy_price >= ask_price` |
| 2 | Add auth to /api/refresh | `src/app/api/refresh/route.ts` | Import and use `isAuthorized` check before calling `runIngest()` |
| 3 | Fix chart PnL calculation | `src/lib/dashboard.ts` | Per-order PnL instead of average-ask × total fill |
| 4 | GET-only → POST-only on ingest | `src/app/api/ingest/route.ts` | Remove GET handler, keep only POST |
| 5 | Fix formatPlacedAt comma | `src/lib/formatters.ts` | Use `formatToParts` or manual date formatting |
| 6 | Dedup deriveStatus call | `src/lib/orders/normalize.ts` | Remove redundant second call |

---

## E2E Test Recipe

1. `bun run dev` (or `npm run dev`) — start the dev server
2. `curl -X POST http://localhost:3000/api/ingest` — trigger an ingest (will fail without env vars for actual Hypixel API, but tests the route)
3. `curl http://localhost:3000/api/health` — verify server responds
4. Unit: `bun run build` — ensures TypeScript compilation succeeds (no tests exist in project)

Since there are no test files in the project, verification is via build success + curl smoke tests.

---

## Worker Instructions Template

```
After you finish implementing the change:
1. **Simplify** — Invoke the `Skill` tool with `skill: "simplify"` to review and clean up your changes.
2. **Run unit tests** — Run `npm run build` to verify TypeScript compilation. If it fails, fix the issues.
3. **Test end-to-end** — Follow the e2e test recipe from the coordinator's prompt.
4. **Commit and push** — Commit all changes with a clear message, push the branch, and create a PR with `gh pr create`. Use a descriptive title.
5. **Report** — End with a single line: `PR: <url>` so the coordinator can track it. If no PR was created, end with `PR: none — <reason>`.
```
