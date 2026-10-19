export default function LeadsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-32 animate-shimmer rounded-lg" />
      <div className="grid gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 animate-shimmer rounded-xl" />
        ))}
      </div>
    </div>
  );
}
