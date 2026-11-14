import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { Check, CheckSquare, Download, FileText, Gauge, Link2, Loader2, MessageSquareText, Plug, Share2, ShieldCheck, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Reveal } from "@/components/motion/primitives";

const clamp = (n: number) => Math.min(1, Math.max(0, n));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

const STAGES = [
  { title: "Connect your sources", body: "Point RetailMind at the Postgres replica, the Snowflake mart and the Shopify store you already run. It reads the schema, tests the connection and masks every host. Nothing is copied out and nothing is written back.", icon: Plug, nav: 0 },
  { title: "Ask in plain English", body: "Type the question you would have sent to an analyst. You get a summary with the numbers called out, a chart, a table and the read-only SQL that produced them, so you can check the work before you act on it.", icon: MessageSquareText, nav: 1 },
  { title: "Export a brief people will act on", body: "Pin the answers that matter. RetailMind assembles them into a one-page brief with the metrics, the chart and the recommended actions, ready to send to merchandising as a PDF or a link.", icon: FileText, nav: 2 },
] as const;

export function Walkthrough() {
  const reduce = useReducedMotion();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const track = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
  const [p, setP] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setP(Math.round(clamp(v) * 200) / 200));

  if (!desktop || reduce) {
    return (
      <div className="space-y-16">
        {STAGES.map((s, i) => (
          <Reveal key={s.title}>
            <StageText i={i} active />
            <div className="mt-6">
              <Mock stage={i} p={1} />
            </div>
          </Reveal>
        ))}
      </div>
    );
  }

  const raw = p * 3;
  const active = Math.min(2, Math.floor(raw));
  const local = clamp(raw - active);
  // Hold each stage's finished state briefly before morphing to the next
  const lp = clamp(local / 0.82);

  return (
    <div ref={track} className="relative h-[330vh]">
      <div className="sticky top-20 grid h-[calc(100vh-7rem)] grid-cols-[minmax(0,380px)_minmax(0,1fr)] items-center gap-14">
        <div className="relative">
          <div className="absolute -left-6 bottom-0 top-0 w-px bg-slate-200" aria-hidden>
            <motion.div className="w-px origin-top bg-ink-600" style={{ height: `${p * 100}%` }} />
          </div>
          <ol className="space-y-9">
            {STAGES.map((_, i) => (
              <li key={i}>
                <StageText i={i} active={i === active} done={i < active} />
              </li>
            ))}
          </ol>
        </div>
        <div className="relative">
          <Mock stage={active} p={lp} morph />
        </div>
      </div>
    </div>
  );
}

function StageText({ i, active, done }: { i: number; active: boolean; done?: boolean }) {
  const s = STAGES[i];
  return (
    <motion.div animate={{ opacity: active ? 1 : 0.38, x: active ? 0 : -4 }} transition={{ duration: 0.35 }}>
      <div className="flex items-center gap-3">
        <span className={cn("grid h-7 w-7 place-items-center rounded-full text-xs font-semibold transition-colors duration-300", active ? "bg-ink-700 text-white" : done ? "bg-ink-100 text-ink-700" : "bg-slate-100 text-slate-400")}>
          {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
        </span>
        <h3 className="text-[21px] font-semibold tracking-[-0.03em] text-slate-900">{s.title}</h3>
      </div>
      <p className="mt-2.5 max-w-[34ch] pl-10 text-[14.5px] leading-relaxed text-slate-600 sm:max-w-none">{s.body}</p>
    </motion.div>
  );
}

const NAV = [
  { icon: Plug, label: "Connectors" },
  { icon: MessageSquareText, label: "Ask AI" },
  { icon: FileText, label: "Reports" },
];

function Mock({ stage, p, morph }: { stage: number; p: number; morph?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_80px_-28px_rgb(38_48_127/.35),0_2px_6px_rgb(15_23_42/.05)]" aria-hidden="true">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        <motion.span layout className="ml-3 rounded-md bg-white px-2.5 py-0.5 font-mono text-[11px] text-slate-400 ring-1 ring-slate-200">
          retailmind.app/{["connectors", "ask", "reports"][stage]}
        </motion.span>
      </div>
      <div className="grid grid-cols-[52px_minmax(0,1fr)] sm:grid-cols-[148px_minmax(0,1fr)]">
        <div className="space-y-1 border-r border-slate-100 bg-[#FBFBFC] p-2">
          {NAV.map((n, i) => (
            <div key={n.label} className="relative flex h-8 items-center gap-2.5 rounded-md px-2 text-[12px] font-medium">
              {i === stage && <motion.span layoutId={morph ? "mock-pill" : undefined} className="absolute inset-0 rounded-md bg-white shadow-[0_0_0_1px_rgb(15_23_42/.07),0_1px_2px_rgb(15_23_42/.06)]" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
              <n.icon className={cn("relative h-4 w-4", i === stage ? "text-ink-700" : "text-slate-400")} />
              <span className={cn("relative hidden sm:block", i === stage ? "text-slate-900" : "text-slate-400")}>{n.label}</span>
            </div>
          ))}
        </div>
        <div className="relative min-h-[430px] min-w-0 p-4 sm:p-5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={stage} initial={morph ? { opacity: 0, y: 14, filter: "blur(4px)" } : false} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -10, filter: "blur(4px)" }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
              {stage === 0 && <ConnectStage p={p} />}
              {stage === 1 && <AskStage p={p} />}
              {stage === 2 && <BriefStage p={p} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ConnectStage({ p }: { p: number }) {
  const rows = [
    { name: "Prod Warehouse", sub: "PostgreSQL · db-prod-use1.••••••.rds.amazonaws.com", at: 0.18, ms: "14 ms" },
    { name: "Shopify Storefront", sub: "REST API · northwind-apparel.myshopify.com", at: 0.4, ms: "22 ms" },
    { name: "POS export, Store 014", sub: "CSV · s3://nw-pos-exports/••••/store-014", at: 0.62, ms: "9 ms" },
  ];
  const schema = seg(p, 0.72, 0.95);
  return (
    <div>
      <h4 className="text-[15px] font-semibold tracking-[-0.02em] text-slate-900">Connectors</h4>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => {
          const ok = p >= r.at;
          return (
            <li key={r.name} className={cn("flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors duration-300", ok ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white")}>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-slate-900">{r.name}</span>
                <span className="block truncate font-mono text-[11px] text-slate-500">{r.sub}</span>
              </span>
              {ok ? (
                <motion.span key="ok" initial={{ rotateX: 90, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                  <span className="num text-emerald-600/80">{r.ms}</span>
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-white"><Check className="h-2.5 w-2.5" strokeWidth={3.5} /></span>
                  Healthy
                </motion.span>
              ) : (
                <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-ink-700">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Testing
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-4 rounded-xl border border-slate-200 p-3.5" style={{ opacity: schema, transform: `translateY(${(1 - schema) * 10}px)` }}>
        <p className="text-[12px] font-medium text-slate-700">Schema found</p>
        <table className="mt-2 w-full text-left text-[12px]">
          <tbody className="divide-y divide-slate-100">
            {[
              ["orders", "7 columns", "1,284,902"],
              ["order_items", "6 columns", "2,311,447"],
              ["customers", "6 columns", "214,880"],
            ].map(([t, c, r]) => (
              <tr key={t}>
                <td className="py-1.5 font-mono text-slate-800">{t}</td>
                <td className="py-1.5 text-slate-500">{c}</td>
                <td className="num py-1.5 text-right text-slate-700">{r}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AskStage({ p }: { p: number }) {
  const Q = "Which products have declining profit margins?";
  const typed = Q.slice(0, Math.floor(seg(p, 0.02, 0.3) * Q.length));
  const answered = p > 0.42;
  const grow = seg(p, 0.46, 0.8);
  const items = [
    { n: "Aero Smartwatch", v: -8.2 },
    { n: "Mesh Wi-Fi 3-Pack", v: -6.6 },
    { n: "Alpine Down Parka", v: -6.1 },
    { n: "Bud Pro ANC Earbuds", v: -4.2 },
  ];
  return (
    <div>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-ink-700 text-[11px] font-semibold text-white">R</span>
        <span className="flex-1 text-[13.5px] text-slate-800">
          {typed}
          {p < 0.34 && <span className="ml-px inline-block h-4 w-[2px] translate-y-0.5 animate-caret bg-ink-600" />}
        </span>
      </div>
      {!answered ? (
        <p className="mt-4 flex items-center gap-2 px-1 text-[13px] text-slate-500" style={{ opacity: p > 0.3 ? 1 : 0 }}>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-600" /> Writing read-only SQL
        </p>
      ) : (
        <div className="mt-4 space-y-3.5">
          <p className="px-1 text-[13.5px] leading-relaxed text-slate-700">
            <b className="rounded-[3px] bg-ink-50 font-semibold text-ink-800 shadow-[0_0_0_2px_#F1F3FD]">5 products</b> lost more than 2 points of gross margin in 90 days. <b className="rounded-[3px] bg-ink-50 font-semibold text-ink-800 shadow-[0_0_0_2px_#F1F3FD]">Aero Smartwatch</b> fell furthest, from 19.9% to 11.7%.
          </p>
          <div className="space-y-2.5 rounded-xl border border-slate-200 p-4">
            {items.map((it) => (
              <div key={it.n} className="flex items-center gap-3 text-[12.5px]">
                <span className="w-[132px] shrink-0 truncate text-slate-700">{it.n}</span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <span className="block h-full rounded-full bg-gradient-to-r from-rose-300 to-rose-500" style={{ width: `${(Math.abs(it.v) / 8.2) * 100 * grow}%` }} />
                </span>
                <span className="num w-[58px] text-right font-medium text-rose-700">{(it.v * grow).toFixed(1)} pts</span>
              </div>
            ))}
          </div>
          <div className="overflow-hidden rounded-xl bg-[#0F1330] px-4 py-3 font-mono text-[11.5px] leading-relaxed text-slate-300" style={{ opacity: seg(p, 0.78, 0.95) }}>
            <span className="text-indigo-300">SELECT</span> p.name, <span className="text-sky-300">ROUND</span>(recent.margin_pct - prior.margin_pct, <span className="text-amber-300">1</span>) <span className="text-indigo-300">AS</span> change_pts
            <br />
            <span className="text-indigo-300">FROM</span> by_period recent <span className="text-indigo-300">JOIN</span> by_period prior <span className="text-indigo-300">ON</span> …
          </div>
          <div className="flex gap-2 px-1" style={{ opacity: seg(p, 0.82, 0.95) }}>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200/70"><ShieldCheck className="h-3 w-3" /> Read-only</span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200"><Gauge className="h-3 w-3" /> 56ms</span>
          </div>
        </div>
      )}
    </div>
  );
}

function BriefStage({ p }: { p: number }) {
  const actions = [
    { t: "Reorder Metro Bomber. 6 days of cover left.", at: 0.5 },
    { t: "Ask the supplier about Aero Smartwatch costs.", at: 0.62 },
    { t: "Send a win-back offer to 2,051 At-Risk customers.", at: 0.74 },
  ];
  const bars = [38, 52, 47, 63, 58, 74, 81];
  const done = p > 0.9;
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-[15px] font-semibold tracking-[-0.02em] text-slate-900">Weekly brief</h4>
          <p className="text-xs text-slate-500">Northwind Apparel &amp; Tech, last 30 days</p>
        </div>
        <div className="flex gap-1.5" style={{ opacity: seg(p, 0.8, 0.95) }}>
          <span className={cn("inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors", done ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-white text-slate-700 ring-1 ring-slate-200")}>
            {done ? <Link2 className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />} {done ? "Link copied" : "Share"}
          </span>
          <span className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-ink-700 px-2.5 text-xs font-medium text-white">
            <Download className="h-3.5 w-3.5" /> PDF
          </span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2.5" style={{ opacity: seg(p, 0.02, 0.2), transform: `translateY(${(1 - seg(p, 0.02, 0.2)) * 8}px)` }}>
        {[
          ["Revenue", "$1.24M", "+12.4%"],
          ["Net margin", "28.4%", "+0.6 pts"],
          ["Avg order", "$142.50", "+2.4%"],
        ].map(([l, v, d]) => (
          <div key={l} className="rounded-xl border border-slate-200 p-3">
            <p className="text-[11px] text-slate-500">{l}</p>
            <p className="num mt-0.5 text-[18px] font-semibold tracking-[-0.03em] text-slate-900">{v}</p>
            <p className="num text-[11px] font-medium text-emerald-700">{d}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl border border-slate-200 p-3.5">
        <p className="text-[12px] font-medium text-slate-700">Revenue by week</p>
        <div className="mt-2.5 flex h-[74px] items-end gap-2">
          {bars.map((b, i) => (
            <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-ink-300 to-ink-600" style={{ height: `${b * seg(p, 0.18 + i * 0.03, 0.42 + i * 0.03)}%` }} />
          ))}
        </div>
      </div>
      <div className="mt-3 rounded-xl border border-slate-200 p-3.5">
        <p className="text-[12px] font-medium text-slate-700">Recommended actions</p>
        <ul className="mt-2 space-y-1.5">
          {actions.map((a) => {
            const on = p >= a.at;
            return (
              <li key={a.t} className="flex items-center gap-2 text-[12.5px] transition-opacity duration-300" style={{ opacity: on ? 1 : 0.25 }}>
                {on ? <CheckSquare className="h-4 w-4 text-ink-600" /> : <Square className="h-4 w-4 text-slate-300" />}
                <span className="text-slate-700">{a.t}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
