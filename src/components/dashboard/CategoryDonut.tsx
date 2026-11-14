import { useState } from "react";
import { Pie, PieChart, ResponsiveContainer, Sector, type PieSectorDataItem } from "recharts";
import { cn, fmtUSD } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/components/charts/theme";
import type { CategorySlice } from "@/data/selectors";

export function CategoryDonut({ data }: { data: CategorySlice[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  const active = hover === null ? null : data[hover];
  const chartData = data.map((d, i) => ({ ...d, fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }));
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative h-[200px] w-[200px] shrink-0" role="img" aria-label="Revenue by category donut chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={84}
              paddingAngle={2}
              cornerRadius={4}
              stroke="none"
              animationDuration={800}
              onMouseLeave={() => setHover(null)}
              shape={(props: PieSectorDataItem & { index?: number }) => {
                const i = props.index ?? -1;
                const on = hover === i;
                return (
                  <Sector
                    {...props}
                    outerRadius={(props.outerRadius ?? 84) + (on ? 8 : 0)}
                    innerRadius={(props.innerRadius ?? 62) - (on ? 1 : 0)}
                    fillOpacity={hover === null || on ? 1 : 0.35}
                    style={{ transition: "all 180ms cubic-bezier(.22,1,.36,1)", cursor: "pointer", outline: "none" }}
                    onMouseEnter={() => setHover(i)}
                  />
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="num text-[22px] font-semibold leading-none tracking-[-0.03em] text-slate-900">{active ? `${active.share.toFixed(1)}%` : total >= 1e6 ? `$${(total / 1e6).toFixed(2)}M` : fmtUSD(total, { compact: true })}</div>
            <div className="mt-1 max-w-[96px] truncate text-[11px] text-slate-500">{active ? active.name : "Net revenue"}</div>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-0.5" onMouseLeave={() => setHover(null)}>
        {chartData.map((d, i) => (
          <li key={d.name}>
            <button
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors", hover === i ? "bg-slate-100" : "hover:bg-slate-50")}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: d.fill }} />
              <span className="flex-1 truncate text-slate-700">{d.name}</span>
              <span className="num text-slate-900">{d.share.toFixed(1)}%</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
