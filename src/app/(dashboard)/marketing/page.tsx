import { Megaphone, Calendar, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import type { ContentItem } from "@/lib/types";

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getContent(): Promise<ContentItem[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("mc_content")
    .select("*")
    .order("scheduled_at", { ascending: true });

  return (data ?? []) as ContentItem[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const typeStyles: Record<string, string> = {
  twitter: "bg-sky-500/15 text-sky-400",
  linkedin: "bg-blue-500/15 text-blue-400",
  blog: "bg-violet-500/15 text-violet-400",
  email: "bg-amber-500/15 text-amber-400",
  video: "bg-rose-500/15 text-rose-400",
};

const statusStyles: Record<string, string> = {
  draft: "bg-zinc-500/15 text-zinc-400",
  scheduled: "bg-amber-500/15 text-amber-400",
  published: "bg-emerald-500/15 text-emerald-400",
  archived: "bg-zinc-500/15 text-zinc-500",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function MarketingPage() {
  const content = await getContent();

  if (content.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Marketing</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Content scheduling and social media management.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/60 py-24">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900">
            <Megaphone className="h-6 w-6 text-zinc-600" />
          </div>
          <p className="text-sm font-medium text-zinc-400">No content yet</p>
          <p className="mt-1 max-w-sm text-center text-xs text-zinc-600">
            Content calendar, LinkedIn scheduling, and campaign analytics will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Marketing</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Content scheduling and social media management.
          </p>
        </div>
        <span className="text-xs text-zinc-500">{content.length} items</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                {["Title", "Type", "Status", "Scheduled", "Published", "Tags", ""].map(
                  (header) => (
                    <th
                      key={header || "link"}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {content.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-zinc-900/30">
                  <td className="px-4 py-3 font-medium text-zinc-200 max-w-xs truncate">
                    {item.title}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                        typeStyles[item.content_type] ?? "bg-zinc-500/15 text-zinc-400"
                      )}
                    >
                      {item.content_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                        statusStyles[item.status] ?? "bg-zinc-500/15 text-zinc-400"
                      )}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {item.scheduled_at ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-zinc-500" />
                        {new Date(item.scheduled_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    ) : (
                      <span className="text-zinc-600">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {item.published_at
                      ? new Date(item.published_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : <span className="text-zinc-600">--</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(item.tags ?? []).slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-zinc-800/60 px-2 py-0.5 text-[10px] font-medium text-zinc-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {item.platform_url && (
                      <a
                        href={item.platform_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
