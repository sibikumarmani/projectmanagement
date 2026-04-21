import type { DashboardMetric } from "@/lib/types";

const toneClasses: Record<DashboardMetric["tone"], string> = {
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-rose-50 text-rose-700",
};

export function StatCard({ label, value, change, tone }: DashboardMetric) {
  return (
    <article className="panel rounded-[24px] p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}>{change ?? "Live"}</span>
      </div>
      <p className="display-font text-4xl font-semibold text-brand-strong">{value}</p>
    </article>
  );
}
