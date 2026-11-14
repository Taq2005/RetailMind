import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendPoint } from "@/data/selectors";
import { C } from "@/components/charts/theme";
import { TipCard } from "@/components/charts/Tip";
import { fmtUSD } from "@/lib/utils";

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const dense = data.length > 14;
  return (
    <div className="h-[300px] w-full flex-1 lg:h-auto lg:min-h-[300px]" role="img" aria-label="Revenue and profit trend chart">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.ink} stopOpacity={0.9} />
              <stop offset="100%" stopColor={C.ink} stopOpacity={0.35} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={C.grid} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: C.axis, fontSize: 11 }} interval={dense ? 4 : 0} minTickGap={16} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: C.axis, fontSize: 11 }} tickFormatter={(v: number) => fmtUSD(v, { compact: true })} width={52} />
          <Tooltip
            cursor={{ fill: "rgb(63 79 196 / 0.06)" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as TrendPoint;
              return (
                <TipCard
                  title={label}
                  rows={[
                    { color: C.ink, label: "Revenue", value: fmtUSD(p.revenue) },
                    { color: C.amber, label: "Net profit", value: fmtUSD(p.profit) },
                  ]}
                  footer={`${p.orders.toLocaleString("en-US")} orders, ${((p.profit / (p.revenue || 1)) * 100).toFixed(1)}% margin`}
                />
              );
            }}
          />
          <Bar dataKey="revenue" fill="url(#barFill)" radius={[4, 4, 0, 0]} maxBarSize={dense ? 14 : 34} animationDuration={700} />
          <Line type="monotone" dataKey="profit" stroke={C.amber} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff", fill: C.amber }} animationDuration={1300} animationEasing="ease-out" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
