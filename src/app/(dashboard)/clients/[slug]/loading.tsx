export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-4 w-32 animate-shimmer rounded-lg" />
        <div className="h-8 w-48 animate-shimmer rounded-lg" />
        <div className="flex gap-2">
          <div className="h-5 w-16 animate-shimmer rounded-full" />
          <div className="h-5 w-20 animate-shimmer rounded-full" />
        </div>
      </div>
      <div className="h-10 w-full animate-shimmer rounded-lg" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-64 animate-shimmer rounded-xl" />
        <div className="h-64 animate-shimmer rounded-xl" />
      </div>
    </div>
  );
}
