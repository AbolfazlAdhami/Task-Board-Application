export function TodoBoardSkeleton() {
  return (
    <section aria-label="در حال بارگذاری برد وظایف" aria-busy="true" className="space-y-5">
      <div className="animate-pulse rounded-3xl border border-border bg-surface p-6">
        <div className="h-4 w-28 rounded bg-surface-raised" />
        <div className="mt-3 h-8 w-40 rounded-lg bg-surface-raised" />
        <div className="mt-3 h-4 w-24 rounded bg-surface-raised" />
      </div>
      <div className="grid items-start gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, column) => (
          <div key={column} className="min-h-72 animate-pulse rounded-2xl border border-border bg-surface-raised/70 p-4">
            <div className="mb-5 flex items-center justify-between">
              <div className="h-5 w-24 rounded bg-surface" />
              <div className="size-7 rounded-full bg-surface" />
            </div>
            <div className="space-y-3">
              <div className="h-36 rounded-2xl border border-border bg-surface" />
              <div className="h-28 rounded-2xl border border-border bg-surface" />
            </div>
          </div>
        ))}
      </div>
      <p role="status" className="sr-only">
        در حال دریافت وظایف…
      </p>
    </section>
  );
}
