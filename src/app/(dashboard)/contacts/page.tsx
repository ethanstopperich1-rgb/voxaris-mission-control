"use client";

import { Users } from "lucide-react";

export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Contacts</h1>
        <p className="mt-1 text-sm text-zinc-400">
          CRM contacts and lead management.
        </p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/60 py-24">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900">
          <Users className="h-6 w-6 text-zinc-600" />
        </div>
        <p className="text-sm font-medium text-zinc-400">Coming soon</p>
        <p className="mt-1 max-w-sm text-center text-xs text-zinc-600">
          Contact enrichment via Apollo, GHL sync, and outreach tracking will be available here.
        </p>
      </div>
    </div>
  );
}
