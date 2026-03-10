"use client";

import { Rocket } from "lucide-react";

export default function DeploymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Deployments</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Vercel deployment monitoring and project management.
        </p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/60 py-24">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900">
          <Rocket className="h-6 w-6 text-zinc-600" />
        </div>
        <p className="text-sm font-medium text-zinc-400">Coming soon</p>
        <p className="mt-1 max-w-sm text-center text-xs text-zinc-600">
          Vercel project status, deployment logs, and domain management will be available here.
        </p>
      </div>
    </div>
  );
}
