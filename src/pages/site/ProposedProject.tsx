import { Link } from "react-router-dom";
import { ArrowRight, Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Item, Reveal, Stagger } from "@/components/motion/primitives";
import { PageHeader } from "@/components/site/PageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";

const PROBLEMS = [
  "Sales, stock and customer records live in separate places: a point-of-sale system, an online store and spreadsheets.",
  "Answering a simple question, such as which products are losing margin, means waiting for someone technical or guessing.",
  "Dashboards show fixed charts. They do not answer the question the owner actually has today.",
  "Tools that answer in plain language are hard to trust when you cannot see how a number was worked out.",
];

const BENEFITS = [
  { t: "Faster decisions", b: "An owner gets an answer in seconds without waiting for a report." },
  { t: "Less lost stock and margin", b: "Items about to run out and products whose margin is slipping are surfaced early." },
  { t: "Numbers that can be checked", b: "Each answer carries its SQL, so a skeptical buyer or accountant can verify it." },
  { t: "Works with what shops already use", b: "It connects to existing systems and exports rather than asking a retailer to start over." },
];

const IN = ["Plain-English questions about sales, stock and margin", "Chart, table and read-only SQL for every answer", "Connectors for PostgreSQL, Snowflake, Shopify and CSV", "An overview dashboard with date and channel filters"];
const OUT = ["Writing to or changing a retailer's data", "Predictions presented as certainties", "Answers to questions it cannot map to the data"];

export default function ProposedProject() {
  usePageTitle("Proposed project");
  return (
    <>
      <PageHeader title="Problem identification and product proposal" intro="The problem we set out to solve, what we propose to build, and what we expect it to change for a retailer." />

      <section className="mx-auto grid max-w-[1200px] gap-12 px-5 py-16 sm:px-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-16 lg:py-24">
        <Reveal>
          <h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-slate-950 sm:text-[36px]">The problem</h2>
        </Reveal>
        <Stagger className="divide-y divide-slate-200 border-y border-slate-200" gap={0.08}>
          {PROBLEMS.map((p) => (
            <Item key={p} className="py-5 text-[16px] leading-relaxed text-slate-700">
              {p}
            </Item>
          ))}
        </Stagger>
      </section>

      <section className="border-y border-slate-200/80 bg-white">
        <div className="mx-auto grid max-w-[1200px] gap-12 px-5 py-16 sm:px-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-16 lg:py-24">
          <Reveal>
            <h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-slate-950 sm:text-[36px]">Our proposed solution</h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="max-w-[56ch] text-[20px] leading-[1.4] tracking-[-0.02em] text-slate-800">RetailMind: a platform where a retailer connects their data once, then asks questions in plain English. Every answer arrives with a summary, a chart, a table and the read-only query that produced it.</p>
            <p className="mt-5 max-w-[56ch] text-[15.5px] leading-relaxed text-slate-600">The query is the point. Because it is always visible, a number is something a retailer can check, not something they have to take on faith. We will start with retailers in Pakistan and extend to international markets.</p>
            <Button asChild className="mt-7">
              <Link to="/app/ask?q=Which products have declining profit margins?">
                Try a question in the demo <ArrowRight />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-6 lg:py-24">
        <Reveal>
          <h2 className="text-[30px] font-semibold tracking-[-0.035em] text-slate-950 sm:text-[36px]">Intended benefits</h2>
        </Reveal>
        <Stagger className="mt-10 grid gap-x-12 gap-y-9 sm:grid-cols-2" gap={0.08}>
          {BENEFITS.map((b) => (
            <Item key={b.t}>
              <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-slate-900">{b.t}</h3>
              <p className="mt-2 max-w-[44ch] text-[14.5px] leading-relaxed text-slate-600">{b.b}</p>
            </Item>
          ))}
        </Stagger>
      </section>

      <section className="border-t border-slate-200/80 bg-white">
        <div className="mx-auto grid max-w-[1200px] gap-12 px-5 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <Reveal>
            <h2 className="text-[26px] font-semibold tracking-[-0.03em] text-slate-950">In scope for the first release</h2>
            <ul className="mt-6 space-y-3.5">
              {IN.map((t) => (
                <li key={t} className="flex gap-3 text-[15px] leading-snug text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.4} />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-[26px] font-semibold tracking-[-0.03em] text-slate-950">Deliberately left out</h2>
            <ul className="mt-6 space-y-3.5">
              {OUT.map((t) => (
                <li key={t} className="flex gap-3 text-[15px] leading-snug text-slate-700">
                  <Minus className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" strokeWidth={2.4} />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-8 max-w-[46ch] text-[14px] leading-relaxed text-slate-500">We will judge the project by whether retailers can answer their own questions faster and trust the answers. Success measures will be set with the first retailers we work with.</p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
