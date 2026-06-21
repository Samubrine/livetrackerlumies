import { createBrowserClient } from "@supabase/ssr";

import { getClientEnv } from "@/lib/env";
import type { Database } from "@/lib/types/database";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const env = getClientEnv();

  browserClient = createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return browserClient;
}
