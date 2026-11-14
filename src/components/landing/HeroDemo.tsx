import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Check, Gauge, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const QUESTION = "Show regional sales distribution for Q3";
const REGIONS = [
  { name: "North America", pct: 43.4, rev: "$1.30M", color: "#26307F" },
  { name: "EMEA", pct: 27.6, rev: "$828K", color: "#3F4FC4" },
  { name: "APAC", pct: 22.8, rev: "$686K", color: "#E8A33D" },
  { name: "LATAM", pct: 6.2, rev: "$188K", color: "#2F8F83" },
];
const CYCLE = 11; // seconds

const clamp = (n: number) => Math.min(1, Math.max(0, n));

export function HeroDemo() {
  const reduce = useReducedMotion();
  const [t, setT] = useState(reduce ? 7 : 0);
  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const t0 = performance.now();
    let last = 0;
    const loop = (now: number) => {
      if (now - last > 33) {
        setT(((now - t0) / 1000) % CYCLE);
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  const typed = QUESTION.slice(0, Math.floor(clamp((t - 0.5) / 2.0) * QUESTION.length));
  const typing = t < 2.6;
  const step = t < 2.8 ? 0 : t < 3.3 ? 1 : t < 3.8 ? 2 : 3;
  const show = t >= 3.8;
  const grow = clamp((t - 3.9) / 1.2);
  const fade = t > CYCLE - 0.5 ? clamp((CYCLE - t) / 0.5) : 1;

  return (
    <div className="relative" aria-hidden="true">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-ink-100/70 via-transparent to-amber-100/60 blur-2xl" />
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_80px_-24px_rgb(38_48_127/.35),0_2px_6px_rgb(15_23_42/.05)]">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="ml-3 rounded-md bg-white px-2.5 py-0.5 font-mono text-[11px] text-slate-400 ring-1 ring-slate-200">retailmind.app/ask</span>
        </div>

        <div className="space-y-4 p-5" style={{ opacity: fade }}>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-ink-700 text-[11px] font-semibold text-white">R</span>
            <span className="flex-1 text-[14px] text-slate-800">
              {typed}
              {typing && <span className="ml-px inline-block h-4 w-[2px] translate-y-0.5 animate-caret bg-ink-600" />}
              {!typed && <span className="text-slate-400">Ask a question about your data</span>}
            </span>
          </div>

          {!show ? (
            <ul className="space-y-1.5 px-1 text-[13px]" style={{ opacity: t < 2.6 ? 0 : 1 }}>
              {["Reading your schema", "Writing read-only SQL", "Running the query"].map((l, i) => (
                <li key={l} className={cn("flex items-center gap-2", i <= step ? "opacity-100" : "opacity-0", i < step ? "text-slate-400" : "text-slate-700")}>
                  {i < step ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-600" />} {l}
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-3.5">
              <p className="px-1 text-[13.5px] leading-relaxed text-slate-700">
                North America led Q3 with <b className="rounded-[3px] bg-ink-50 font-semibold text-ink-800 shadow-[0_0_0_2px_#F1F3FD]">$1.30M</b>, 43.4% of the quarter's <b className="rounded-[3px] bg-ink-50 font-semibold text-ink-800 shadow-[0_0_0_2px_#F1F3FD]">$3.00M</b>. APAC grew fastest at <b className="rounded-[3px] bg-ink-50 font-semibold text-ink-800 shadow-[0_0_0_2px_#F1F3FD]">+25.8%</b>.
              </p>
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                  {REGIONS.map((r) => (
                    <div key={r.name} className="h-full border-r-2 border-white last:border-r-0" style={{ width: `${r.pct * grow}%`, background: r.color }} />
                  ))}
                </div>
                <ul className="mt-3.5 space-y-2">
                  {REGIONS.map((r) => (
                    <li key={r.name} className="flex items-center gap-2.5 text-[13px]">
                      <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: r.color }} />
                      <span className="flex-1 text-slate-700">{r.name}</span>
                      <span className="num text-slate-400">{r.rev}</span>
                      <span className="num w-12 text-right font-medium text-slate-900">{(r.pct * grow).toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap items-center gap-2 px-1">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200/70">
                  <ShieldCheck className="h-3 w-3" /> Read-only
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                  <Gauge className="h-3 w-3" /> 22ms
                </span>
                <span className="font-mono text-[11px] text-slate-400">SELECT q3.region, ROUND(q3.revenue) …</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
