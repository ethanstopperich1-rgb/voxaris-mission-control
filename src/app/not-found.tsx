import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <h1 className="text-6xl font-bold text-zinc-700">404</h1>
      <p className="text-sm text-zinc-400">Page not found</p>
      <Link
        href="/"
        className="mt-4 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
      >
        Back to Mission Control
      </Link>
    </div>
  );
}
