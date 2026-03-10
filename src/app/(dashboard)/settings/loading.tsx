export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-28 animate-shimmer rounded-lg" />
        <div className="h-4 w-72 animate-shimmer rounded-lg" />
      </div>
      <div className="h-10 w-72 animate-shimmer rounded-lg" />
      <div className="h-80 animate-shimmer rounded-xl" />
    </div>
  );
}
