export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-24 animate-shimmer rounded-lg" />
        <div className="h-4 w-56 animate-shimmer rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-shimmer rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 animate-shimmer rounded-xl" />
        <div className="h-72 animate-shimmer rounded-xl" />
      </div>
      <div className="h-64 animate-shimmer rounded-xl" />
    </div>
  );
}
