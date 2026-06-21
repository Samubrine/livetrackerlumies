import { z } from "zod";

const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url(),
  HYPIXEL_API_BASE_URL: z.url().default("https://api.hypixel.net"),
  HYPIXEL_API_KEY: z.string().optional(),
  HYPIXEL_BAZAAR_PRODUCT_ID: z.string().min(1).default("ENCHANTED_SEA_LUMIE"),
  INGEST_CRON_SECRET: z.string().optional(),
  CRON_SECRET: z.string().optional(),
});

const clientSchema = serverSchema.pick({
  NEXT_PUBLIC_SUPABASE_URL: true,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: true,
  NEXT_PUBLIC_SITE_URL: true,
});

function formatZodError(error: z.ZodError) {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("; ");
}

export function getServerEnv() {
  const parsed = serverSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(`Invalid server environment: ${formatZodError(parsed.error)}`);
  }

  return parsed.data;
}

export function getClientEnv() {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });

  if (!parsed.success) {
    throw new Error(`Invalid client environment: ${formatZodError(parsed.error)}`);
  }

  return parsed.data;
}

export type ServerEnv = ReturnType<typeof getServerEnv>;
export type ClientEnv = ReturnType<typeof getClientEnv>;
