"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard, Building2, Bot, Phone, Kanban, Users,
  Megaphone, DollarSign, Globe, Settings, Search
} from "lucide-react";

const pages = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, section: "Navigation" },
  { name: "Clients", href: "/clients", icon: Building2, section: "Navigation" },
  { name: "Agent Hub", href: "/agents", icon: Bot, section: "Navigation" },
  { name: "Call Center", href: "/calls", icon: Phone, section: "Navigation" },
  { name: "Pipeline", href: "/pipeline", icon: Kanban, section: "Navigation" },
  { name: "Contacts", href: "/contacts", icon: Users, section: "Navigation" },
  { name: "Marketing", href: "/marketing", icon: Megaphone, section: "Navigation" },
  { name: "Finance", href: "/finance", icon: DollarSign, section: "Navigation" },
  { name: "Deployments", href: "/deployments", icon: Globe, section: "Navigation" },
  { name: "Settings", href: "/settings", icon: Settings, section: "Navigation" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      {/* Palette */}
      <div className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2">
        <Command
          className="rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/50 overflow-hidden"
          loop
        >
          <div className="flex items-center gap-2 border-b border-zinc-800 px-4">
            <Search size={16} className="text-zinc-500" />
            <Command.Input
              placeholder="Search pages, clients, agents..."
              className="h-12 w-full bg-transparent text-sm text-zinc-200 placeholder:text-zinc-500 outline-none"
              autoFocus
            />
            <kbd className="shrink-0 rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-72 overflow-y-auto p-2">
            <Command.Empty className="px-4 py-8 text-center text-sm text-zinc-500">
              No results found.
            </Command.Empty>
            <Command.Group heading="Navigation" className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {pages.map((page) => (
                <Command.Item
                  key={page.href}
                  value={page.name}
                  onSelect={() => navigate(page.href)}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-300 transition-all duration-150 aria-selected:bg-zinc-800 aria-selected:text-zinc-100 hover:bg-zinc-800/60"
                >
                  <page.icon size={16} className="text-zinc-500" />
                  {page.name}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </>
  );
}
