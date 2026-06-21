"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { HeadlineCards } from "@/components/dashboard/headline-cards";
import { NotificationsFeed } from "@/components/dashboard/notifications-feed";
import { OrderForm } from "@/components/dashboard/order-form";
import { OrdersTable } from "@/components/dashboard/orders-table";
import { PnlChart } from "@/components/dashboard/pnl-chart";
import type { DashboardPayload, TimeRangeOption } from "@/lib/types/domain";

const chartRanges: TimeRangeOption[] = [
  "30s",
  "1m",
  "5m",
  "15m",
  "1h",
  "3h",
  "6h",
  "12h",
  "1d",
  "3d",
  "1w",
];

type LiveDashboardProps = {
  initialPayload: DashboardPayload;
};

export function LiveDashboard({ initialPayload }: LiveDashboardProps) {
  const [payload, setPayload] = useState(initialPayload);
  const [activeRange, setActiveRange] = useState<TimeRangeOption>(initialPayload.activeRange);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultPlacedAt = useMemo(() => new Date().toISOString().slice(0, 16), []);

  const refreshDashboard = useCallback(
    async (rangeOverride?: TimeRangeOption) => {
      const range = rangeOverride ?? activeRange;
      setIsRefreshing(true);
      setError(null);

      try {
        const [metricsResponse, ordersResponse, chartResponse, notificationsResponse] =
          await Promise.all([
            fetch("/api/metrics", { cache: "no-store" }),
            fetch("/api/orders", { cache: "no-store" }),
            fetch(`/api/chart?range=${range}`, { cache: "no-store" }),
            fetch("/api/notifications", { cache: "no-store" }),
          ]);

        if (
          !metricsResponse.ok ||
          !ordersResponse.ok ||
          !chartResponse.ok ||
          !notificationsResponse.ok
        ) {
          throw new Error("One or more dashboard requests failed.");
        }

        const [metricsData, ordersData, chartData, notificationsData] = await Promise.all([
          metricsResponse.json(),
          ordersResponse.json(),
          chartResponse.json(),
          notificationsResponse.json(),
        ]);

        setPayload({
          cards: metricsData.cards,
          orders: ordersData.orders,
          notifications: notificationsData.notifications,
          points: chartData.points,
          activeRange: chartData.range,
        });
      } catch (requestError) {
        setError(
          requestError instanceof Error ? requestError.message : "Dashboard refresh failed.",
        );
      } finally {
        setIsRefreshing(false);
      }
    },
    [activeRange],
  );

  const ingestAndRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const ingestResponse = await fetch("/api/refresh", {
        method: "POST",
      });

      if (!ingestResponse.ok) {
        throw new Error("Ingest request failed.");
      }

      await refreshDashboard();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Refresh ingest failed.",
      );
      setIsRefreshing(false);
    }
  }, [refreshDashboard]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshDashboard();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [refreshDashboard]);

  function handleRangeChange(range: TimeRangeOption) {
    setActiveRange(range);
    void refreshDashboard(range);
  }

  async function handleOrderCreated() {
    await refreshDashboard();
  }

  async function handleOrderDeleted() {
    await refreshDashboard();
  }

  return (
    <>
      <div className="xl:shrink-0">
        <HeadlineCards cards={payload.cards} />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-stone-300 sm:flex-row sm:items-center sm:justify-between xl:shrink-0">
        <div className="min-w-0">
          <span className="font-medium text-stone-100">Live dashboard</span>
          <span className="ml-2 text-stone-400">
            {isRefreshing ? "Refreshing..." : "Polling every 15s"}
          </span>
          {error ? <span className="ml-2 text-rose-300">{error}</span> : null}
        </div>
        <button
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-100 transition hover:bg-white/10"
          type="button"
          onClick={() => void ingestAndRefresh()}
        >
          {isRefreshing ? "Refreshing..." : "Refresh + ingest"}
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_0.95fr]">
        <div className="grid gap-5 xl:grid-rows-[minmax(340px,0.95fr)_minmax(280px,1.05fr)]">
          <PnlChart
            points={payload.points}
            activeRange={activeRange}
            availableRanges={chartRanges}
            onRangeChange={handleRangeChange}
          />
          <OrdersTable orders={payload.orders} onDeleted={handleOrderDeleted} />
        </div>

        <div className="grid gap-5 xl:grid-rows-[minmax(300px,0.9fr)_minmax(260px,1.1fr)]">
          <OrderForm defaultPlacedAt={defaultPlacedAt} onCreated={handleOrderCreated} />
          <NotificationsFeed items={payload.notifications} />
        </div>
      </div>
    </>
  );
}
