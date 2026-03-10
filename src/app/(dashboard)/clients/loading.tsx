export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 animate-shimmer rounded-lg" />
          <div className="h-4 w-64 animate-shimmer rounded-lg" />
        </div>
        <div className="h-10 w-32 animate-shimmer rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 animate-shimmer rounded-xl" />
        ))}
      </div>
    </div>
  );
}
