import { Users, Mail, Phone, Linkedin, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Contact } from "@/lib/types";

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getContacts(): Promise<Contact[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("mc_contacts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (data ?? []) as Contact[];
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ContactsPage() {
  const contacts = await getContacts();

  if (contacts.length === 0) {
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
          <p className="text-sm font-medium text-zinc-400">No contacts yet</p>
          <p className="mt-1 max-w-sm text-center text-xs text-zinc-600">
            Contact enrichment via Apollo, GHL sync, and outreach tracking will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Contacts</h1>
          <p className="mt-1 text-sm text-zinc-400">
            CRM contacts and lead management.
          </p>
        </div>
        <span className="text-xs text-zinc-500">{contacts.length} contacts</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                {["Name", "Company", "Title", "Email", "Phone", "Source", "Tags"].map(
                  (header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {contacts.map((contact) => (
                <tr key={contact.id} className="transition-colors hover:bg-zinc-900/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300">
                        {contact.first_name?.[0] ?? ""}{contact.last_name?.[0] ?? ""}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-200">
                          {contact.first_name} {contact.last_name}
                        </p>
                        {contact.city && (
                          <p className="text-xs text-zinc-500">
                            {contact.city}{contact.state ? `, ${contact.state}` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      {contact.company && <Building2 className="h-3.5 w-3.5 text-zinc-500" />}
                      {contact.company ?? <span className="text-zinc-600">--</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {contact.title ?? <span className="text-zinc-600">--</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {contact.email ? (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-zinc-500" />
                        {contact.email}
                      </span>
                    ) : (
                      <span className="text-zinc-600">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {contact.phone ? (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-zinc-500" />
                        {contact.phone}
                      </span>
                    ) : (
                      <span className="text-zinc-600">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {contact.source ? (
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400">
                        {contact.source}
                      </span>
                    ) : (
                      <span className="text-zinc-600 text-xs">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(contact.tags ?? []).slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-zinc-800/60 px-2 py-0.5 text-[10px] font-medium text-zinc-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
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
