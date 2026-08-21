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
    <div className="mt-3 w-full rounded-2xl border border-border bg-white p-4">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e2d8" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#57534e" }} axisLine={{ stroke: "#e7e2d8" }} tickLine={false} />
            <YAxis allowDecimals={false} width={30} tick={{ fontSize: 12, fill: "#57534e" }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "#f5f2ec" }}
              contentStyle={{ borderRadius: 12, border: "1px solid #e7e2d8", fontSize: 13 }}
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
