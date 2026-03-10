export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-32 animate-shimmer rounded-lg" />
        <div className="h-4 w-64 animate-shimmer rounded-lg" />
      </div>
      <div className="h-96 animate-shimmer rounded-xl" />
    </div>
  );
}
