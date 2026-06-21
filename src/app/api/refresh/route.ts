import { runIngest } from "@/lib/ingest/run-ingest";

export async function POST() {
  const result = await runIngest();

  return Response.json({ ok: true, result });
}
