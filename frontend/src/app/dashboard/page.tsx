"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CostTrendChart, MilestonePulseChart } from "@/components/dashboard/dashboard-charts";
import { DataTable } from "@/components/common/data-table";
import { SectionCard } from "@/components/common/section-card";
import { StatCard } from "@/components/common/stat-card";
import { AppShell } from "@/components/layout/app-shell";
import { useIsClient } from "@/hooks/use-is-client";
import { dashboardApi } from "@/lib/api";
import type { DashboardMetric, ReportSnapshot } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

type DashboardResponse = {
  metrics: DashboardMetric[];
  projects: Array<{
    id: string;
    code: string;
    name: string;
    manager: string;
    status: string;
    progress: number;
  }>;
  risks: Array<{
    id: string;
    title: string;
    category: string;
    owner: string;
    severity: number;
  }>;
  costSnapshots: ReportSnapshot[];
  milestonePulse: Array<{
    name: string;
    value: number;
  }>;
};

export default function DashboardPage() {
  const router = useRouter();
  const isClient = useIsClient();
  const { accessToken, hasHydrated, clearAuth } = useAppStore();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isClient || !hasHydrated || !accessToken) {
      return;
    }

    let cancelled = false;

    async function loadDashboard() {
      try {
        const response = await dashboardApi.getSummary();
        if (!cancelled) {
          setDashboard(response.data.data);
          setError(null);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
            clearAuth();
            router.replace("/login");
            return;
          }

          setError("Dashboard data could not be loaded from the database.");
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [accessToken, clearAuth, hasHydrated, isClient, router]);

  return (
    <AppShell
      title="Portfolio dashboard"
      subtitle="A single operations cockpit for planning, cost health, milestone movement, and top delivery risks."
    >
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <section className="grid gap-4 xl:grid-cols-4">
        {(dashboard?.metrics ?? []).map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <SectionCard title="Budget, allocation, and actual trend" eyebrow="Cost Control">
          <CostTrendChart data={dashboard?.costSnapshots ?? []} />
        </SectionCard>
        <SectionCard title="Milestone pulse" eyebrow="Schedule Health">
          <MilestonePulseChart data={dashboard?.milestonePulse ?? []} />
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <SectionCard title="Project summary" eyebrow="Active Portfolio">
          <DataTable
            rows={dashboard?.projects ?? []}
            columns={[
              { key: "code", header: "Code" },
              { key: "name", header: "Project" },
              { key: "manager", header: "Manager" },
              {
                key: "status",
                header: "Status",
                render: (row) => <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold">{row.status}</span>,
              },
              {
                key: "progress",
                header: "Progress",
                render: (row) => `${row.progress}%`,
              },
            ]}
          />
        </SectionCard>
        <SectionCard title="Top risks" eyebrow="Attention List">
          <div className="space-y-3">
            {(dashboard?.risks ?? []).map((risk) => (
              <div key={risk.id} className="rounded-2xl border border-line bg-white/65 p-4">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-brand-strong">{risk.title}</p>
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                    Severity {risk.severity}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{risk.category}</p>
                <p className="mt-2 text-sm text-slate-600">Owner: {risk.owner}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
    </AppShell>
  );
}
