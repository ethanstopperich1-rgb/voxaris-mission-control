export default function ApprovalsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 animate-shimmer rounded-lg" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-7 w-20 animate-shimmer rounded-full" />
        ))}
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 divide-y divide-zinc-800/50">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-shimmer" />
        ))}
      </div>
    </div>
  );
}
