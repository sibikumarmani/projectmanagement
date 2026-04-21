"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Bell, ChevronDown, Search } from "lucide-react";
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

  useEffect(() => {
    if (!isClient || !hasHydrated) {
      return;
    }

    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, hasHydrated, isClient, router]);

  if (!isClient || !hasHydrated || !accessToken) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="panel rounded-[28px] px-8 py-6 text-sm font-semibold text-brand-strong">Checking session...</div>
      </main>
    );
  }

  return (
    <div className="min-h-screen px-4 py-4 md:px-6 lg:px-8">
      <div className="app-shell mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1600px] gap-4 rounded-[36px] border border-white/50 p-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="panel rounded-[30px] p-5">
          <div className="mb-10">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand">Enterprise PMS</p>
            <h1 className="display-font text-2xl font-semibold text-brand-strong">Control Center</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
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
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-brand-strong text-white shadow-lg shadow-slate-900/10"
                      : "text-slate-600 hover:bg-white/70 hover:text-brand-strong"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-10 rounded-[24px] bg-brand px-5 py-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Phase Focus</p>
            <p className="mt-3 display-font text-xl font-semibold">Project to Activity baseline</p>
            <p className="mt-2 text-sm leading-6 text-white/80">
              Build data discipline early so cost, material, labour, and risk stay traceable later.
            </p>
          </div>
        </aside>

        <main className="space-y-4">
          <header className="panel flex flex-col gap-4 rounded-[30px] p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand">Operations View</p>
              <h2 className="display-font text-3xl font-semibold text-brand-strong">{title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{subtitle}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex items-center gap-3 rounded-full border border-line bg-white/70 px-4 py-3 text-sm text-slate-500">
                <Search className="h-4 w-4" />
                Search projects, WBS, or requests
              </div>
              <div className="flex items-center gap-3">
                <button className="rounded-full border border-line bg-white/70 p-3 text-slate-600">
                  <Bell className="h-4 w-4" />
                </button>
                <button className="flex items-center gap-3 rounded-full border border-line bg-white/70 px-3 py-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-strong text-sm font-bold text-white">
                    {user?.fullName?.slice(0, 2).toUpperCase() ?? "PM"}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-brand-strong">{user?.fullName ?? "User"}</p>
                    <p className="text-xs text-slate-500">{user?.roleName ?? "Role"}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </button>
                <button
                  className="rounded-full bg-brand px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white"
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
    </div>
  );
}
