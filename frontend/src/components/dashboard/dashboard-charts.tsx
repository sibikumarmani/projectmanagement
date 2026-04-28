"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useIsClient } from "@/hooks/use-is-client";
import type { ReportSnapshot } from "@/lib/types";

type MilestonePulseItem = {
  name: string;
  value: number;
};

export function CostTrendChart({ data }: { data: ReportSnapshot[] }) {
  const isClient = useIsClient();
  const tooltipStyle = {
    backgroundColor: "var(--surface-raised)",
    border: "1px solid var(--line)",
    borderRadius: "18px",
    color: "var(--foreground)",
  } as const;

  if (!isClient) {
    return <div className="surface-soft h-[300px] w-full rounded-none" />;
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="month" tick={{ fill: "var(--chart-axis)" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "var(--chart-axis)" }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "color-mix(in srgb, var(--brand) 10%, transparent)" }} />
          <Bar dataKey="budget" fill="var(--chart-budget)" radius={[10, 10, 0, 0]} />
          <Bar dataKey="allocated" fill="var(--chart-allocated)" radius={[10, 10, 0, 0]} />
          <Bar dataKey="actual" fill="var(--chart-actual)" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MilestonePulseChart({ data }: { data: MilestonePulseItem[] }) {
  const isClient = useIsClient();
  const colors = ["var(--chart-budget)", "var(--chart-allocated)", "var(--chart-actual)"];
  const tooltipStyle = {
    backgroundColor: "var(--surface-raised)",
    border: "1px solid var(--line)",
    borderRadius: "18px",
    color: "var(--foreground)",
  } as const;

  if (!isClient) {
    return <div className="surface-soft h-[300px] w-full rounded-none" />;
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={4}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
