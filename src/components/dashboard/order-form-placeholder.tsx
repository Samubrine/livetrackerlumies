export function OrderFormPlaceholder() {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-stone-950/60 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">
        Shared entry
      </p>
      <h2 className="mt-2 text-xl font-semibold text-stone-50">Order capture coming next</h2>
      <p className="mt-3 max-w-xl text-sm text-stone-400">
        Phase 2 will add anonymous shared order entry tied to Supabase writes, lifecycle updates,
        and immediate recalculation against the latest Sea Lumies snapshot.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[
          "Placed at",
          "Ask price",
          "Original quantity",
          "Status",
          "Note",
          "Submit order",
        ].map((label) => (
          <div
            key={label}
            className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-stone-500"
          >
            {label}
          </div>
        ))}
      </div>
    </section>
  );
}
