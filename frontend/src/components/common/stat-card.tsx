import type { DashboardMetric } from "@/lib/types";

const toneClasses: Record<DashboardMetric["tone"], string> = {
  success: "pill-success",
  warning: "pill-warning",
  danger: "pill-danger",
};

export function StatCard({ label, value, change, tone }: DashboardMetric) {
  return (
    <article className="panel flex h-full flex-col rounded-[24px] p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-[color:var(--foreground-muted)]">{label}</p>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}>{change ?? "Live"}</span>
      </div>
      <p className="display-font text-4xl font-semibold text-brand-strong">{value}</p>
    </article>
  );
}
