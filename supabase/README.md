# Supabase setup

## Apply migrations

Run the initial schema with the Supabase CLI:

```bash
supabase db push
```

If you already applied the first migration earlier, run `supabase db push` again so the
new `market_snapshots` quick-status columns are added.

## Generate database types

After linking the Supabase project, generate fresh types and replace
`src/lib/types/database.ts`:

```bash
supabase gen types typescript --linked > src/lib/types/database.ts
```

## Notes

- v1 intentionally allows anonymous shared order writes.
- Server-side ingestion should use the service role key.
- Set `HYPIXEL_BAZAAR_PRODUCT_ID` to the exact Bazaar product key for Sea Lumies in your environment.
- Optionally set `INGEST_CRON_SECRET` and send it as `x-cron-secret` from Vercel cron.
- For Vercel native cron auth, set `CRON_SECRET`. Vercel sends `Authorization: Bearer <CRON_SECRET>` on cron requests.
- Vercel cron jobs hit your route with `GET`, so `/api/ingest` accepts both `GET` and `POST`.
- On Vercel Hobby, high-frequency cron is not available. The included `vercel.json` uses daily scheduling as a deploy-safe default for cloud testing.
- For instant testing after deploy, call `/api/ingest` manually from the browser, `curl`, or the Vercel Functions tab.
- Revisit RLS before public launch, even if the site stays semi-private.
