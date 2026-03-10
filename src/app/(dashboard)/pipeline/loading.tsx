export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-32 animate-shimmer rounded-lg" />
        <div className="h-4 w-64 animate-shimmer rounded-lg" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-80 w-72 shrink-0 animate-shimmer rounded-xl" />
        ))}
      </div>
    </div>
  );
}
