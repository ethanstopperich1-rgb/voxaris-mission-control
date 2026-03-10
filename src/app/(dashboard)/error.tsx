"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-6 text-center">
        <h2 className="text-lg font-semibold text-red-400">Something went wrong</h2>
        <p className="mt-2 text-sm text-zinc-400">{error.message}</p>
        <button
          onClick={reset}
          className="mt-4 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
