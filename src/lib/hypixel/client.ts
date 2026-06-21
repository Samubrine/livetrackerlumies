import { getServerEnv } from "@/lib/env";

const BAZAAR_PATH = "/v2/skyblock/bazaar";

export async function fetchHypixelBazaar() {
  const env = getServerEnv();

  const response = await fetch(`${env.HYPIXEL_API_BASE_URL}${BAZAAR_PATH}`, {
    headers: env.HYPIXEL_API_KEY
      ? {
          "API-Key": env.HYPIXEL_API_KEY,
        }
      : undefined,
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Hypixel Bazaar request failed with status ${response.status}`);
  }

  return response.json() as Promise<unknown>;
}
