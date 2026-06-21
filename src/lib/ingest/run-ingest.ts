import { getServerEnv } from "@/lib/env";
import { insertMarketSnapshot } from "@/lib/db/market-snapshots";
import { fetchHypixelBazaar } from "@/lib/hypixel/client";
import { parseBazaarSnapshot } from "@/lib/hypixel/parser";
import { recalculateFromLatestSnapshot } from "@/lib/metrics/recalculate";

export async function runIngest() {
  const env = getServerEnv();

  const payload = await fetchHypixelBazaar();
  const snapshotInput = parseBazaarSnapshot(payload, env.HYPIXEL_BAZAAR_PRODUCT_ID);
  const snapshot = await insertMarketSnapshot(snapshotInput);
  const recalculation = await recalculateFromLatestSnapshot(snapshot.id);

  return {
    itemKey: env.HYPIXEL_BAZAAR_PRODUCT_ID,
    snapshot,
    recalculation,
  };
}
