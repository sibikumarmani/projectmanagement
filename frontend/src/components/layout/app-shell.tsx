"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Bot, X } from "lucide-react";
import { AgentPanel } from "@/components/agent/agent-panel";
import { useIsClient } from "@/hooks/use-is-client";
import { accountApi } from "@/lib/api";
import { navigationItems } from "@/lib/navigation";
import { useAppStore } from "@/store/app-store";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { MenuBar } from "@/components/layout/menu-bar";
import { TopBar } from "@/components/layout/top-bar";

type AppShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AppShell({ title, subtitle, children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, hasHydrated, user, clearAuth, updateUser } = useAppStore();
  const isClient = useIsClient();
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const userInitials = user?.fullName
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() ?? "PM";

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

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let cancelled = false;

    async function syncProfile() {
      try {
        const response = await accountApi.getProfile();
        if (cancelled) {
          return;
        }

        const profile = response.data.data;
        updateUser({
          fullName: profile.fullName,
          userCode: profile.userCode,
          email: profile.email,
          roleName: profile.roleName,
          avatarImage: profile.avatarImage,
        });
      } catch {
        return;
      }
    }

    void syncProfile();

    return () => {
      cancelled = true;
    };
  }, [accessToken, updateUser]);

  if (!isClient || !hasHydrated || !accessToken) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="panel rounded-[28px] px-8 py-6 text-sm font-semibold text-brand-strong">Checking session...</div>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="fixed inset-x-0 top-0 z-40 overflow-visible">
        <TopBar
          appName="Project Management & Cost Control"
          avatarLabel={userInitials}
          userName={user?.fullName ?? "User"}
          userEmail={user?.email ?? ""}
          userCode={user?.userCode ?? ""}
          avatarImage={user?.avatarImage ?? null}
          userRole={user?.roleName ?? user?.email ?? "Member"}
          onProfileSave={async ({ fullName, avatarImage }) => {
            const response = await accountApi.updateProfile({ fullName, avatarImage });
            const profile = response.data.data;
            updateUser({
              fullName: profile.fullName,
              userCode: profile.userCode,
              email: profile.email,
              roleName: profile.roleName,
              avatarImage: profile.avatarImage,
            });
          }}
          onPasswordChange={async ({ currentPassword, newPassword }) => {
            await accountApi.changePassword({ currentPassword, newPassword });
          }}
          onLogout={() => {
            clearAuth();
            router.replace("/login");
          }}
        />
        <MenuBar items={navigationItems} />
      </div>

      <LayoutWrapper title={title} subtitle={subtitle}>
        {children}
      </LayoutWrapper>

      <button
        className={`fixed bottom-4 right-4 z-40 inline-flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold shadow-2xl transition sm:bottom-6 sm:right-6 sm:px-5 sm:py-4 ${
          isAgentOpen
            ? "btn-secondary shadow-slate-900/25"
            : "btn-primary shadow-slate-900/20 hover:translate-y-[-1px]"
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
          className={`overlay-scrim absolute inset-0 transition ${isAgentOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setIsAgentOpen(false)}
          type="button"
        />
        <section
          className={`page-surface absolute right-0 top-0 h-full w-full max-w-2xl border-l border-[color:var(--line-strong)] p-4 shadow-2xl shadow-slate-900/20 transition duration-300 md:p-5 ${
            isAgentOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="mb-4 flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand">Agent Sidebar</p>
              <h3 className="display-font text-xl font-semibold text-brand-strong sm:text-2xl">Create data with chat</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--foreground-muted)]">
                Describe the records you need, and the agent will create linked PMS data from the side panel without
                leaving the current page.
              </p>
            </div>
            <button
              className="btn-secondary rounded-full p-3 text-[color:var(--foreground-muted)]"
              onClick={() => setIsAgentOpen(false)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              <AgentPanel compact />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
