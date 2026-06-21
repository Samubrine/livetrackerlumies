import { getClientEnv } from "@/lib/env";

export async function GET() {
  const env = getClientEnv();

  return Response.json({
    ok: true,
    app: "sea-lumies-live-tracker",
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
    supabaseUrlConfigured: Boolean(env.NEXT_PUBLIC_SUPABASE_URL),
  });
}
