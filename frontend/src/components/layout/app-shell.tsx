"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Bell, Bot, ChevronDown, Search, X } from "lucide-react";
import { AgentPanel } from "@/components/agent/agent-panel";
import { useIsClient } from "@/hooks/use-is-client";
import { navigationItems } from "@/lib/navigation";
import { useAppStore } from "@/store/app-store";

type AppShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AppShell({ title, subtitle, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { accessToken, hasHydrated, user, clearAuth } = useAppStore();
  const isClient = useIsClient();
  const [isAgentOpen, setIsAgentOpen] = useState(false);

  useEffect(() => {
    if (!isClient || !hasHydrated) {
      return;
    }

    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, hasHydrated, isClient, router]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsAgentOpen(false);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  if (!isClient || !hasHydrated || !accessToken) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="panel rounded-[28px] px-8 py-6 text-sm font-semibold text-brand-strong">Checking session...</div>
      </main>
    );
  }

  return (
    <div className="min-h-screen px-3 py-3 sm:px-4 sm:py-4 md:px-6 lg:px-8">
      <div className="app-shell mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1600px] gap-3 rounded-[28px] border border-white/55 p-3 sm:min-h-[calc(100vh-2rem)] sm:gap-4 sm:rounded-[36px] sm:p-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="panel rounded-[24px] bg-[linear-gradient(180deg,rgba(255,251,244,0.92),rgba(248,240,229,0.88))] p-4 sm:rounded-[30px] sm:p-5">
          <div className="mb-6 sm:mb-10">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand">Enterprise PMS</p>
            <h1 className="display-font text-xl font-semibold text-brand-strong sm:text-2xl">Control Center</h1>
            <p className="mt-3 text-sm leading-6 text-[color:var(--foreground-muted)]">
              Planning, cost, execution, and risk connected through one delivery model.
            </p>
          </div>

          <nav className="space-y-2">
            {navigationItems.map(({ href, icon: Icon, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-white text-brand-strong shadow-lg shadow-slate-900/10 ring-1 ring-[color:var(--line-strong)]"
                      : "text-[color:var(--foreground-muted)] hover:bg-white/75 hover:text-brand-strong"
                  }`}
                >
                  {active ? <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-[color:var(--highlight)]" /> : null}
                  <Icon className={`h-4 w-4 shrink-0 ${active ? "text-brand" : ""}`} />
                  <span className={active ? "font-bold tracking-[0.01em] text-brand-strong" : ""}>{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 rounded-[24px] border border-white/20 bg-[linear-gradient(160deg,#cb6a42,#9f4f31)] px-4 py-5 text-white shadow-xl shadow-orange-950/10 sm:mt-10 sm:px-5 sm:py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Phase Focus</p>
            <p className="mt-3 display-font text-lg font-semibold sm:text-xl">Project to Activity baseline</p>
            <p className="mt-2 text-sm leading-6 text-white/80">
              Build data discipline early so cost, material, labour, and risk stay traceable later.
            </p>
          </div>
        </aside>

        <main className="space-y-4">
          <header className="panel flex flex-col gap-4 rounded-[24px] bg-[linear-gradient(180deg,rgba(255,252,248,0.92),rgba(251,245,238,0.88))] p-4 sm:rounded-[30px] sm:p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand">Operations View</p>
              <h2 className="display-font text-2xl font-semibold text-brand-strong sm:text-3xl">{title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--foreground-muted)]">{subtitle}</p>
            </div>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="flex min-h-12 w-full items-center gap-3 rounded-[20px] border border-[color:var(--line-strong)] bg-white/75 px-4 py-3 text-sm text-[color:var(--foreground-muted)] shadow-sm xl:w-auto xl:min-w-[260px] xl:rounded-full">
                <Search className="h-4 w-4" />
                <span className="truncate">Search projects, WBS, or requests</span>
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
                <button className="rounded-full border border-[color:var(--line-strong)] bg-white/75 p-3 text-[color:var(--foreground-muted)] shadow-sm">
                  <Bell className="h-4 w-4" />
                </button>
                <button className="flex min-w-0 items-center gap-3 rounded-[18px] border border-[color:var(--line-strong)] bg-white/78 px-3 py-2 shadow-sm sm:rounded-full">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#173a59,#2f628f)] text-sm font-bold text-white">
                    {user?.fullName?.slice(0, 2).toUpperCase() ?? "PM"}
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="truncate text-sm font-semibold text-brand-strong">{user?.fullName ?? "User"}</p>
                    <p className="truncate text-xs text-[color:var(--foreground-muted)]">{user?.roleName ?? "Role"}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 text-[color:var(--foreground-muted)]" />
                </button>
                <button
                  className="col-span-2 rounded-full bg-[linear-gradient(135deg,#cb6a42,#ad5635)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-lg shadow-orange-950/10 sm:col-span-1"
                  onClick={() => {
                    clearAuth();
                    router.replace("/login");
                  }}
                  type="button"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          {children}
        </main>
      </div>

      <button
        className={`fixed bottom-4 right-4 z-40 inline-flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold shadow-2xl transition sm:bottom-6 sm:right-6 sm:px-5 sm:py-4 ${
          isAgentOpen
            ? "bg-slate-900 text-white shadow-slate-900/25"
            : "bg-[linear-gradient(135deg,#173a59,#29547d)] text-white shadow-slate-900/20 hover:translate-y-[-1px]"
        }`}
        onClick={() => setIsAgentOpen((current) => !current)}
        type="button"
      >
        <Bot className="h-5 w-5" />
        {isAgentOpen ? "Close Agent" : "Ask Agent"}
      </button>

      <div
        className={`fixed inset-0 z-50 transition ${isAgentOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <button
          aria-label="Close agent popup"
          className={`absolute inset-0 bg-slate-950/35 transition ${isAgentOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setIsAgentOpen(false)}
          type="button"
        />
        <section
          className={`absolute bottom-0 left-0 right-0 mx-auto w-full max-w-6xl rounded-t-[28px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,251,246,0.98),rgba(245,240,232,0.98))] p-4 shadow-2xl shadow-slate-900/20 transition duration-300 sm:rounded-t-[34px] md:p-5 ${
            isAgentOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
          }`}
        >
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand">Agent Popup</p>
              <h3 className="display-font text-xl font-semibold text-brand-strong sm:text-2xl">Create data with chat</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--foreground-muted)]">
                Describe the records you need, and the agent will create linked PMS data from the bottom sheet without
                leaving the current page.
              </p>
            </div>
            <button
              className="rounded-full border border-[color:var(--line-strong)] bg-white/80 p-3 text-[color:var(--foreground-muted)]"
              onClick={() => setIsAgentOpen(false)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <AgentPanel compact />
        </section>
      </div>
    </div>
  );
}
