"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Hexagon } from "lucide-react";
import { NAV_SECTIONS } from "@/lib/constants";
import { useMissionControl } from "@/lib/store";

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useMissionControl();

  const NavContent = () => (
    <>
      {/* Brand */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 border border-gold/20">
            <Hexagon size={18} className="text-gold" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold tracking-tight text-foreground">
              VOXARIS
            </h1>
          </div>
        </div>
        <p className="mt-1.5 pl-0.5 text-[10px] font-medium text-gold-dim">
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
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-gold/[0.08] text-gold"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon
                    size={16}
                    strokeWidth={isActive ? 2 : 1.5}
                    className={isActive ? "text-gold" : "text-muted-foreground"}
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
        className="fixed left-4 top-4 z-50 rounded-xl border border-border bg-card p-2 shadow-sm lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
      >
        {sidebarOpen ? (
          <X size={18} className="text-foreground" />
        ) : (
          <Menu size={18} className="text-foreground" />
        )}
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-[220px] flex-col border-r border-border bg-card transition-transform duration-200 lg:translate-x-0 ${
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
