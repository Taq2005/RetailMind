import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountUp, Item } from "@/components/motion/primitives";

function Sparkline({ values, tone }: { values: number[]; tone: "ink" | "amber" }) {
  const w = 96;
  const h = 32;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 3 - ((v - min) / span) * (h - 6)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const color = tone === "ink" ? "#3F4FC4" : "#E8A33D";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-24 overflow-visible" aria-hidden>
      <motion.path key={d} d={d} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
      <motion.circle key={d + "c"} cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.5} fill={color} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 }} />
    </svg>
  );
}

export interface KpiProps {
  label: string;
  value: number;
  format: (n: number) => string;
  delta: number | null;
  deltaUnit: "%" | "pts";
  note: string;
  spark: number[];
  tone?: "ink" | "amber";
}

export function KpiCard({ label, value, format, delta, deltaUnit, note, spark, tone = "ink" }: KpiProps) {
  const up = (delta ?? 0) >= 0;
  return (
    <Item className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-lift transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-pop">
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        <Sparkline values={spark} tone={tone} />
      </div>
      <div className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.035em] text-slate-900">
        <CountUp value={value} format={format} />
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        {delta === null ? (
          <span className="text-slate-400">No comparison</span>
        ) : (
          <span className={cn("inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-md px-1.5 py-0.5 font-medium num", up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")}>
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}
            {deltaUnit === "%" ? "%" : " pts"}
          </span>
        )}
        <span className="truncate text-slate-400">{note}</span>
      </div>
    </Item>
  );
}
