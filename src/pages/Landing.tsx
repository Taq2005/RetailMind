import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Eye, Lock, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/Logo";
import { CountUp, Item, Reveal, Stagger } from "@/components/motion/primitives";
import { HeroDemo } from "@/components/landing/HeroDemo";
import { Walkthrough } from "@/components/landing/Walkthrough";
import { SqlHighlight } from "@/components/ask/SqlHighlight";

const TRUST_SQL = `-- "Which SKUs will stock out in 14 days?"
SELECT p.name                                  AS product,
       p.stock_quantity                        AS on_hand,
       ROUND(p.stock_quantity / v.units_per_day, 1) AS days_of_cover
FROM   products p
JOIN   velocity v ON v.product_id = p.id
WHERE  p.stock_quantity / v.units_per_day < 14
ORDER  BY days_of_cover;`;

export default function Landing() {
  return (
    <div className="relative bg-background">
      <header className="glass fixed inset-x-0 top-0 z-50 border-b border-slate-200/70">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-5 sm:px-6">
          <Link to="/" aria-label="RetailMind home" className="rounded-md">
            <Wordmark />
          </Link>
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Sections">
            {[
              ["How it works", "#how"],
              ["Trust", "#trust"],
            ].map(([l, h]) => (
              <a key={h} href={h} className="rounded-md px-3 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
                {l}
              </a>
            ))}
          </nav>
          <Button asChild size="sm">
            <Link to="/app">Open the demo</Link>
          </Button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden pt-14">
        <div className="ambient absolute inset-0" aria-hidden />
        <div className="grid-fade absolute inset-x-0 top-0 h-[560px]" aria-hidden />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-5 pb-20 pt-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-14 lg:pb-28 lg:pt-24">
          <Stagger gap={0.09} delay={0.05}>
            <Item>
              <h1 className="text-[44px] font-semibold leading-[1.02] tracking-[-0.045em] text-slate-950 sm:text-[60px]"><span className="block">Ask your sales data.</span><span className="block">Check the SQL.</span><span className="block">Send the brief.</span></h1>
            </Item>
            <Item>
              <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-slate-600">
                RetailMind connects to your warehouse, Shopify store and POS exports, answers questions in plain English, and shows the read-only query behind every number.
              </p>
            </Item>
            <Item className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to="/app">
                  Open the demo workspace <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#how">See how it works</a>
              </Button>
            </Item>
            <Item>
              <p className="mt-5 text-[13px] text-slate-500">The demo runs on synthetic data for a $12M apparel and electronics retailer. No sign-up.</p>
            </Item>
          </Stagger>

          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}>
            <HeroDemo />
          </motion.div>
        </div>

        <div className="relative border-y border-slate-200/80 bg-white/60 backdrop-blur-sm">
          <Stagger className="mx-auto grid max-w-[1200px] grid-cols-2 gap-y-6 px-5 py-8 sm:px-6 md:grid-cols-4" gap={0.08}>
            {[
              { v: 95081, f: (n: number) => Math.round(n).toLocaleString("en-US"), l: "orders in the demo workspace" },
              { v: 20000, f: (n: number) => Math.round(n).toLocaleString("en-US"), l: "customers across four regions" },
              { v: 8, f: (n: number) => String(Math.round(n)), l: "connectors, from Postgres to CSV" },
              { v: 56, f: (n: number) => `${Math.round(n)}ms`, l: "to answer a margin question over 196K order lines" },
            ].map((s) => (
              <Item key={s.l} className="md:border-l md:border-slate-200 md:pl-6 md:first:border-l-0 md:first:pl-0">
                <div className="text-[34px] font-semibold leading-none tracking-[-0.04em] text-slate-900">
                  <CountUp value={s.v} format={s.f} />
                </div>
                <p className="mt-2 max-w-[22ch] text-[13px] leading-snug text-slate-500">{s.l}</p>
              </Item>
            ))}
          </Stagger>
        </div>
      </section>

      {/* WALKTHROUGH */}
      <section id="how" className="relative mx-auto max-w-[1200px] scroll-mt-14 px-5 pb-10 pt-24 sm:px-6 lg:pt-32">
        <Reveal className="mb-14 max-w-[30ch] lg:mb-16">
          <h2 className="text-[34px] font-semibold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-[42px]">From a database login to a brief your buyers will read</h2>
        </Reveal>
        <Walkthrough />
      </section>

      {/* TRUST */}
      <section id="trust" className="relative scroll-mt-14 border-t border-slate-200/80 bg-white">
        <div className="mx-auto grid max-w-[1200px] grid-cols-[minmax(0,1fr)] gap-14 px-5 py-24 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)] lg:py-32">
          <div>
            <Reveal>
              <h2 className="max-w-[18ch] text-[34px] font-semibold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-[42px]">An answer you can't audit is a guess</h2>
              <p className="mt-5 max-w-[48ch] text-[16px] leading-relaxed text-slate-600">
                Every response opens to the query that produced it. Your analysts can read it, copy it, and rerun it in their own tools. If the SQL is wrong, the answer is wrong, and you can see that before the number reaches a meeting.
              </p>
            </Reveal>
            <Stagger className="mt-10 divide-y divide-slate-200 border-y border-slate-200" gap={0.1}>
              {[
                { icon: Lock, t: "Read-only by construction", b: "Queries run as a role that can only SELECT. There is no path from a question to a write." },
                { icon: Eye, t: "Hosts and keys stay masked", b: "Connection details show as db-prod.••••••.rds.amazonaws.com everywhere after you save them." },
                { icon: Route, t: "Every figure has a source", b: "Summaries, charts and tables come from the same query result, so they can't disagree." },
              ].map((r) => (
                <Item key={r.t} className="flex gap-4 py-5">
                  <r.icon className="mt-0.5 h-5 w-5 shrink-0 text-ink-600" />
                  <div>
                    <h3 className="text-[15px] font-semibold tracking-[-0.015em] text-slate-900">{r.t}</h3>
                    <p className="mt-1 max-w-[52ch] text-[14px] leading-relaxed text-slate-600">{r.b}</p>
                  </div>
                </Item>
              ))}
            </Stagger>
          </div>
          <Reveal delay={0.1} className="self-center">
            <div className="overflow-hidden rounded-2xl bg-[#0F1330] shadow-[0_30px_70px_-24px_rgb(15_19_48/.6)]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
                <span className="text-[11px] text-emerald-300">SELECT only. Runs as retailmind_readonly</span>
                <span className="num text-[11px] text-slate-400">19ms</span>
              </div>
              <SqlHighlight sql={TRUST_SQL} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-slate-200/80">
        <div className="ambient absolute inset-0" aria-hidden />
        <Reveal className="relative mx-auto flex max-w-[1200px] flex-col items-start gap-8 px-5 py-24 sm:px-6 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-[20ch] text-[34px] font-semibold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-[44px]">Try a question on a year of Northwind's orders</h2>
          <Button asChild size="lg" className="shrink-0">
            <Link to="/app/ask?q=Which products have declining profit margins?">
              Ask about margins <ArrowRight />
            </Link>
          </Button>
        </Reveal>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-5 py-8 text-[13px] text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Wordmark />
          <p>RetailMind is a product demo. All data shown is synthetic.</p>
        </div>
      </footer>
    </div>
  );
}
