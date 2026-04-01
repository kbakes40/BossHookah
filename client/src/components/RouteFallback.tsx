/** Shown briefly while a lazy route chunk is loading. */
export default function RouteFallback() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 px-4">
      <div
        className="h-10 w-10 border-3 border-primary border-t-transparent animate-spin"
        aria-hidden
      />
      <p className="text-sm font-semibold text-muted-foreground">Loading…</p>
    </div>
  );
}
