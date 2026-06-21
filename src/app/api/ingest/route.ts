import { getServerEnv } from "@/lib/env";
import { runIngest } from "@/lib/ingest/run-ingest";

function isAuthorized(request: Request, manualSecret: string | undefined, cronSecret: string | undefined) {
  if (!manualSecret && !cronSecret) {
    return true;
  }

  const manualHeader = request.headers.get("x-cron-secret");
  const authHeader = request.headers.get("authorization");

  if (manualSecret && manualHeader === manualSecret) {
    return true;
  }

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  return false;
}

async function handleIngest(request: Request) {
  const env = getServerEnv();

  if (!isAuthorized(request, env.INGEST_CRON_SECRET, env.CRON_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json(await runIngest());
}

export async function POST(request: Request) {
  return handleIngest(request);
}
