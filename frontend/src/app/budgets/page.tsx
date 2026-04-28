"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SectionCard } from "@/components/common/section-card";
import { AppShell } from "@/components/layout/app-shell";
import { useIsClient } from "@/hooks/use-is-client";
import { dashboardApi } from "@/lib/api";
import type { ReportSnapshot } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

type BudgetSummaryResponse = {
  costSnapshots: ReportSnapshot[];
};

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function BudgetsPage() {
  const router = useRouter();
  const isClient = useIsClient();
  const { accessToken, hasHydrated, clearAuth } = useAppStore();
  const [budgetData, setBudgetData] = useState<BudgetSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isClient || !hasHydrated || !accessToken) {
      return;
    }

    let cancelled = false;

    async function loadBudgetData() {
      try {
        const response = await dashboardApi.getSummary();
        if (!cancelled) {
          setBudgetData({
            costSnapshots: response.data.data.costSnapshots ?? [],
          });
          setError(null);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
            clearAuth();
            router.replace("/login");
            return;
          }

          setError("Budget data could not be loaded from the database.");
        }
      }
    }

    void loadBudgetData();

    return () => {
      cancelled = true;
    };
  }, [accessToken, clearAuth, hasHydrated, isClient, router]);

  const snapshots = budgetData?.costSnapshots ?? [];

  return (
    <AppShell
      title="Budgeting and allocation"
      subtitle="Phase 3-ready budget controls with activity-level capture, revision discipline, and budget-versus-allocation monitoring."
    >
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {snapshots.map((snapshot) => (
          <SectionCard key={snapshot.month} title={`${snapshot.month} cost snapshot`} eyebrow="Budget Control">
            <div className="space-y-3 text-sm text-[color:var(--foreground-muted)]">
              <div className="flex items-center justify-between rounded-2xl bg-[color:var(--surface-soft)] px-4 py-3">
                <span>Budget</span>
                <strong>{formatAmount(snapshot.budget)}</strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[color:var(--surface-soft)] px-4 py-3">
                <span>Allocated</span>
                <strong>{formatAmount(snapshot.allocated)}</strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[color:var(--surface-soft)] px-4 py-3">
                <span>Actual</span>
                <strong>{formatAmount(snapshot.actual)}</strong>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>

      {!error && snapshots.length === 0 ? (
        <SectionCard title="No budget snapshots yet" eyebrow="Budget Control">
          <p className="text-sm text-[color:var(--foreground-muted)]">
            No budget data is available in the database yet. Add projects with start dates and budget values to populate this view.
          </p>
        </SectionCard>
      ) : null}
    </AppShell>
  );
}
