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

  if (!isClient) {
    return <div className="h-[300px] w-full rounded-[20px] bg-white/40" />;
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid vertical={false} stroke="rgba(16,32,51,0.08)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />
          <Bar dataKey="budget" fill="#163a57" radius={[10, 10, 0, 0]} />
          <Bar dataKey="allocated" fill="#bf5a36" radius={[10, 10, 0, 0]} />
          <Bar dataKey="actual" fill="#d6c2a4" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MilestonePulseChart({ data }: { data: MilestonePulseItem[] }) {
  const isClient = useIsClient();
  const colors = ["#163a57", "#bf5a36", "#c17b1f"];

  if (!isClient) {
    return <div className="h-[300px] w-full rounded-[20px] bg-white/40" />;
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
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
