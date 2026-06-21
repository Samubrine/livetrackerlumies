import type { NotificationFeedItem } from "@/lib/types/domain";

type NotificationsFeedProps = {
  items: NotificationFeedItem[];
};

export function NotificationsFeed({ items }: NotificationsFeedProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-stone-950/60 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">
        Session alerts
      </p>
      <h2 className="mt-2 text-xl font-semibold text-stone-50">Live notifications</h2>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-amber-200/10 bg-amber-300/5 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-amber-50">{item.title}</h3>
              <span className="text-xs text-stone-400">{item.triggeredAt}</span>
            </div>
            <p className="mt-2 text-sm text-stone-300">{item.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
