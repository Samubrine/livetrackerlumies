import { getServerEnv } from "@/lib/env";
import { runIngest } from "@/lib/ingest/run-ingest";

function isAuthorized(request: Request, manualSecret: string | undefined, cronSecret: string | undefined) {
  if (!manualSecret && !cronSecret) return true;

  if (manualSecret && request.headers.get("x-cron-secret") === manualSecret) return true;
  if (cronSecret && request.headers.get("authorization") === `Bearer ${cronSecret}`) return true;

  return false;
}

export async function POST(request: Request) {
  const env = getServerEnv();

  if (!isAuthorized(request, env.INGEST_CRON_SECRET, env.CRON_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runIngest();

  return Response.json({ ok: true, result });
}
