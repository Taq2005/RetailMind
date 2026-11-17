import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ReferenceLine, ResponsiveContainer, Sector, Tooltip, XAxis, YAxis, type PieSectorDataItem } from "recharts";
import { useState } from "react";
import type { ChartSpec } from "@/data/askEngine";
import { C, CATEGORY_COLORS, SERIES_COLORS } from "@/components/charts/theme";
import { TipCard } from "@/components/charts/Tip";
import { fmtUSD, money } from "@/lib/utils";

const compactNum = (v: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v);
const fullNum = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 2 });
const fmtAxis = (kind: "pct" | "usd" | "num1" | "num") => (v: number) => (kind === "pct" ? `${v}%` : kind === "usd" ? fmtUSD(v, { compact: true }) : kind === "num" ? compactNum(v) : String(v));
const fmtVal = (kind: "pct" | "usd" | "num1" | "num", v: number) => (kind === "pct" ? `${v.toFixed(1)}%` : kind === "usd" ? fmtUSD(v) : kind === "num" ? fullNum(v) : `${v.toFixed(1)} days`);
const tick = { fill: C.axis, fontSize: 11 };

export function ResultChart({ spec }: { spec: ChartSpec }) {
  const [hover, setHover] = useState<number | null>(null);

  if (spec.kind === "line") {
    return (
      <div className="h-[280px]" role="img" aria-label="Line chart of the query result">
        <ResponsiveContainer>
          <LineChart data={spec.data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={C.grid} />
            <XAxis dataKey={spec.xKey} tickLine={false} axisLine={false} tick={tick} />
            <YAxis tickLine={false} axisLine={false} tick={tick} tickFormatter={fmtAxis(spec.yFormat)} width={44} domain={["auto", "auto"]} />
            <Tooltip
              content={({ active, payload, label }) =>
                active && payload?.length ? <TipCard title={label} rows={payload.map((p) => ({ color: String(p.color), label: String(p.name), value: fmtVal(spec.yFormat, Number(p.value)) }))} /> : null
              }
            />
            <Legend iconType="plainline" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            {spec.series.map((s, i) => (
              <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={SERIES_COLORS[i % SERIES_COLORS.length]} strokeWidth={2.25} dot={{ r: 3, strokeWidth: 0, fill: SERIES_COLORS[i % SERIES_COLORS.length] }} activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }} animationDuration={1100} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (spec.kind === "bar") {
    return (
      <div className="h-[280px]" role="img" aria-label="Bar chart of the query result">
        <ResponsiveContainer>
          <BarChart data={spec.data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={C.grid} />
            <XAxis dataKey={spec.xKey} tickLine={false} axisLine={false} tick={tick} interval={0} />
            <YAxis tickLine={false} axisLine={false} tick={tick} tickFormatter={fmtAxis(spec.yFormat)} width={52} />
            <Tooltip
              cursor={{ fill: "rgb(63 79 196 / 0.06)" }}
              content={({ active, payload, label }) =>
                active && payload?.length ? <TipCard title={label} rows={payload.map((p) => ({ color: String(p.color ?? p.fill), label: String(p.name), value: fmtVal(spec.yFormat, Number(p.value)) }))} /> : null
              }
            />
            {spec.series.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />}
            {spec.series.map((s, i) => (
              <Bar key={s.key} dataKey={s.key} name={s.label} fill={SERIES_COLORS[i === 0 ? 0 : 1]} radius={[4, 4, 0, 0]} maxBarSize={36} animationDuration={800} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (spec.kind === "hbar") {
    const h = Math.max(220, spec.data.length * 34 + 40);
    return (
      <div style={{ height: h }} role="img" aria-label="Ranked bar chart of the query result">
        <ResponsiveContainer>
          <BarChart data={spec.data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
            <CartesianGrid horizontal={false} stroke={C.grid} />
            <XAxis type="number" tickLine={false} axisLine={false} tick={tick} tickFormatter={fmtAxis(spec.yFormat)} />
            <YAxis type="category" dataKey={spec.labelKey} tickLine={false} axisLine={false} tick={{ ...tick, fill: "#475569" }} width={150} />
            <Tooltip
              cursor={{ fill: "rgb(63 79 196 / 0.06)" }}
              content={({ active, payload, label }) =>
                active && payload?.length ? <TipCard title={label} rows={[{ color: C.ink, label: spec.valueLabel ?? (spec.valueKey === "cover" ? "Cover" : "Value"), value: fmtVal(spec.yFormat, Number(payload[0].value)) }]} /> : null
              }
            />
            {spec.refLine && <ReferenceLine x={spec.refLine.value} stroke={C.amber} strokeDasharray="4 4" label={{ value: spec.refLine.label, fill: "#9A6A1B", fontSize: 11, position: "top" }} />}
            <Bar dataKey={spec.valueKey} radius={[0, 4, 4, 0]} barSize={18} animationDuration={900}>
              {spec.data.map((d, i) => (
                <Cell key={i} fill={spec.refLine && Number(d[spec.valueKey]) < spec.refLine.value ? "#C2553B" : C.ink} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const total = spec.data.reduce((s, d) => s + d.value, 0);
  const fmtD = (v: number) => (spec.unit === "num" ? fullNum(v) : money(v));
  const data = spec.data.map((d, i) => ({ ...d, fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }));
  const active = hover === null ? null : data[hover];
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-[240px] w-[240px] shrink-0" role="img" aria-label="Donut chart of the query result">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={72}
              outerRadius={98}
              paddingAngle={2}
              cornerRadius={4}
              stroke="none"
              animationDuration={900}
              onMouseLeave={() => setHover(null)}
              shape={(props: PieSectorDataItem & { index?: number }) => {
                const i = props.index ?? -1;
                const on = hover === i;
                return <Sector {...props} outerRadius={(props.outerRadius ?? 98) + (on ? 9 : 0)} fillOpacity={hover === null || on ? 1 : 0.35} style={{ transition: "all 180ms cubic-bezier(.22,1,.36,1)", cursor: "pointer", outline: "none" }} onMouseEnter={() => setHover(i)} />;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="num text-2xl font-semibold tracking-[-0.03em] text-slate-900">{active ? fmtD(active.value) : fmtD(total)}</div>
            <div className="mt-0.5 text-xs text-slate-500">{active ? `${active.name}, ${((active.value / total) * 100).toFixed(1)}%` : spec.centerLabel ?? "Q3 revenue"}</div>
          </div>
        </div>
      </div>
      <ul className="w-full space-y-1" onMouseLeave={() => setHover(null)}>
        {data.map((d, i) => (
          <li key={d.name}>
            <button onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-slate-50">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: d.fill }} />
              <span className="flex-1 text-slate-700">{d.name}</span>
              <span className="num font-medium text-slate-900">{fmtD(d.value)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
