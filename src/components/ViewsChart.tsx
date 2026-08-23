"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ViewsChart({
  data,
  series,
}: {
  data: Record<string, string | number>[];
  series: { key: string; color: string }[];
}) {
  return (
    <div className="mt-3 w-full rounded-2xl border border-foreground bg-card p-4">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
            <YAxis allowDecimals={false} width={30} tick={{ fontSize: 12, fill: "var(--foreground)" }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "var(--muted)" }}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                backgroundColor: "var(--card)",
                fontSize: 13,
              }}
              labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
            />
            {/* Légende sous le graphe (`verticalAlign="bottom"`) : couleur <-> nom d'espèce. */}
            <Legend verticalAlign="bottom" height={32} wrapperStyle={{ fontSize: 13 }} />
            {series.map(({ key, color }) => (
              <Bar key={key} dataKey={key} fill={color} radius={[2, 2, 0, 0]} maxBarSize={24} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
