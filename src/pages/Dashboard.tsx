import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, TrendingDown, UserMinus } from "lucide-react";
import { useDB } from "@/hooks/useDB";
import { attention, categoryBreakdown, kpis, retentionSeries, topVelocity, trendSeries, windowLabel } from "@/data/selectors";
import type { ChannelFilter, RangeKey } from "@/data/types";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { CategoryDonut } from "@/components/dashboard/CategoryDonut";
import { VelocityList } from "@/components/dashboard/VelocityList";
import { Reveal, Skeleton, Stagger } from "@/components/motion/primitives";
import { cn, fmtUSD } from "@/lib/utils";
import { NoSalesData } from "@/components/NoSalesData";

function Panel({ title, sub, action, children, className }: { title: string; sub?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-lift", className)}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.02em] text-slate-900">{title}</h2>
          {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

const TONE = { bad: "bg-rose-50 text-rose-600", warn: "bg-amber-50 text-amber-700", info: "bg-ink-50 text-ink-700" } as const;
const ICON = { stock: AlertTriangle, risk: UserMinus, returns: TrendingDown } as const;

export default function Dashboard() {
  const { db, loading, error, isDemoAccount } = useDB();
  const [range, setRange] = useState<RangeKey>("30d");
  const [channel, setChannel] = useState<ChannelFilter>("all");

  const view = useMemo(() => {
    if (!db) return null;
    const k = kpis(db, range, channel);
    const trend = trendSeries(db, range, channel);
    return {
      k,
      trend,
      cats: categoryBreakdown(db, range, channel),
      vel: topVelocity(db, range, channel),
      ret: retentionSeries(db, channel),
      attn: attention(db),
    };
  }, [db, range, channel]);

  if (!isDemoAccount) return <NoSalesData />;

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-16 pt-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.035em] text-slate-900">Overview</h1>
          <p className="mt-1 text-sm text-slate-500">{view ? `${windowLabel(view.k.window)}, ${view.k.orders.toLocaleString("en-US")} orders` : "Demo analytics"}</p>
        </div>
        <FilterBar range={range} channel={channel} onRange={setRange} onChannel={setChannel} />
      </motion.div>

      {error ? (
        <p role="alert" className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>
      ) : loading || !view ? (
        <DashboardSkeleton />
      ) : (
        <>
          <Stagger className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" gap={0.08}>
            <KpiCard label="Total revenue" value={view.k.revenue} format={(n) => (n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : fmtUSD(n))} delta={view.k.revenueDelta} deltaUnit="%" note={view.k.compareLabel} spark={view.trend.map((t) => t.revenue)} />
            <KpiCard label="Net profit margin" value={view.k.margin} format={(n) => `${n.toFixed(1)}%`} delta={view.k.marginDelta} deltaUnit="pts" note={view.k.compareLabel} spark={view.trend.map((t) => (t.revenue ? (t.profit / t.revenue) * 100 : 0))} tone="amber" />
            <KpiCard label="Average order value" value={view.k.aov} format={(n) => fmtUSD(n, { decimals: 2 })} delta={view.k.aovDelta} deltaUnit="%" note={view.k.compareLabel} spark={view.trend.map((t) => (t.orders ? t.revenue / t.orders : 0))} />
            <KpiCard
              label={view.k.retentionKind === "retention" ? "Customer retention" : "Repeat purchase rate"}
              value={view.k.retention}
              format={(n) => `${n.toFixed(1)}%`}
              delta={view.k.retentionDelta}
              deltaUnit="pts"
              note={view.k.retentionKind === "retention" ? view.k.compareLabel : "H1 buyers who bought again since July"}
              spark={view.ret.length > 1 ? view.ret : [view.k.retention, view.k.retention]}
              tone="amber"
            />
          </Stagger>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            <Reveal className="h-full">
              <Panel
                className="h-full"
                title="Revenue and profit"
                sub={range === "30d" ? "Daily" : range === "qtd" ? "Weekly" : "Monthly"}
                action={
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-[3px] bg-ink-500" />Revenue</span>
                    <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded bg-amber-signal" />Net profit</span>
                  </div>
                }
              >
                <TrendChart key={`${range}-${channel}`} data={view.trend} />
              </Panel>
            </Reveal>
            <Reveal delay={0.08} className="h-full">
              <Panel title="Category breakdown" sub="Share of net revenue" className="h-full">
                <CategoryDonut data={view.cats} />
              </Panel>
            </Reveal>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
            <Reveal>
              <Panel
                title="Top 5 products by velocity"
                sub="Units sold per week in the selected range"
                action={
                  <Link to="/app/ask?q=Which SKUs will stock out in 14 days?" className="group inline-flex items-center gap-1 text-xs font-medium text-ink-700 hover:underline">
                    Check stock-outs <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                }
              >
                <VelocityList key={`${range}-${channel}`} rows={view.vel} />
              </Panel>
            </Reveal>
            <Reveal delay={0.08}>
              <Panel title="Needs attention" sub="Found in the last 24 hours">
                <ul className="-mx-2 space-y-1">
                  {view.attn.map((a) => {
                    const Icon = ICON[a.id as keyof typeof ICON];
                    return (
                      <li key={a.id}>
                        <Link to={a.href} className="group flex gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50">
                          <span className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg", TONE[a.tone])}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px] font-medium text-slate-900">{a.title}</span>
                            <span className="block text-xs leading-snug text-slate-500">{a.detail}</span>
                          </span>
                          <ArrowRight className="mt-2 h-3.5 w-3.5 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-slate-600" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            </Reveal>
          </div>
        </>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mt-6 space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[116px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Skeleton className="h-[380px] rounded-xl" />
        <Skeleton className="h-[380px] rounded-xl" />
      </div>
    </div>
  );
}
