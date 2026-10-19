export default function WorkflowsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 animate-shimmer rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 animate-shimmer rounded-xl" />
        ))}
      </div>
    </div>
  );
}
