"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAV_SECTIONS } from "@/lib/constants";
import { useMissionControl } from "@/lib/store";

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useMissionControl();

  const NavContent = () => (
    <>
      {/* Brand */}
      <div className="px-4 pt-5 pb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Voxaris AI"
          width={140}
          className="mb-1"
        />
        <p className="pl-0.5 text-[10px] font-medium text-zinc-400">
          Mission Control
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 overflow-y-auto">
        {NAV_SECTIONS.map((section, sectionIdx) => (
          <div key={section.title}>
            {sectionIdx > 0 && (
              <div className="mx-3 my-3 h-px bg-border" />
            )}
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            {section.items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group/nav relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-zinc-200/[0.08] text-zinc-200 shadow-sm shadow-zinc-200/5"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground hover:translate-x-0.5"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-zinc-300 transition-all duration-200" />
                  )}
                  <Icon
                    size={16}
                    strokeWidth={isActive ? 2 : 1.5}
                    className={`transition-colors duration-150 ${isActive ? "text-zinc-200" : "text-muted-foreground group-hover/nav:text-foreground"}`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer -- version */}
      <div className="px-4 pb-4">
        <div className="mx-3 mb-3 h-px bg-border" />
        <p className="px-3 text-[10px] font-mono text-muted-foreground">
          v1.0.0 &middot; Voxaris AI
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed left-4 top-4 z-50 rounded-xl border border-border bg-card p-2 shadow-sm transition-all duration-150 hover:bg-accent hover:border-zinc-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
      >
        {sidebarOpen ? (
          <X size={18} className="text-foreground" />
        ) : (
          <Menu size={18} className="text-foreground" />
        )}
      </button>

      {/* Mobile overlay -- always mounted, toggled via opacity for smooth fade */}
      <div
        className={`fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity duration-200 lg:pointer-events-none lg:hidden ${
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-[220px] flex-col border-r border-border bg-card transition-transform duration-200 ease-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <NavContent />
      </aside>
    </>
  );
}
