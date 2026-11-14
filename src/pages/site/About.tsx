import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Item, Reveal, Stagger } from "@/components/motion/primitives";
import { PageHeader } from "@/components/site/PageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";

const FACTS = [
  ["Company", "RetailMind"],
  ["What we build", "Retail analytics software. Retailers ask questions in plain English and get an answer, a chart, a table and the query behind it."],
  ["Business area", "Software for retailers, starting with apparel and electronics and open to other kinds of shops."],
  ["Home market", "Pakistan"],
  ["Who it is for", "Retailers and the people who run buying, stock and sales for them."],
  ["Where we are going", "International markets, with Pakistan as the base we learn from."],
];

const STAGES = [
  { t: "Today", b: "A working prototype. Connect a source, ask questions, read the SQL, export results. It runs on sample data so anyone can try it without sharing theirs." },
  { t: "Next", b: "Work with Pakistani retailers on real stock, sales and margin questions, and turn what we learn into the first usable release." },
  { t: "Later", b: "Prepare RetailMind for international retailers: more currencies and languages, and the connectors those markets rely on." },
];

export default function About() {
  usePageTitle("About");
  return (
    <>
      <PageHeader title="Retail answers you can check for yourself" intro="RetailMind is a retail analytics company from Pakistan. We are building software that explains a shop's numbers in plain language and always shows its working." />

      <section className="mx-auto grid max-w-[1200px] gap-14 px-5 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:py-28">
        <Reveal>
          <h2 className="max-w-[20ch] text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-slate-950 sm:text-[38px]">Most shops already have the data. Few can ask it a question.</h2>
          <div className="mt-6 max-w-[56ch] space-y-4 text-[16px] leading-relaxed text-slate-600">
            <p>Sales sit in a point-of-sale system, an online store and a few spreadsheets. To learn which products are losing margin or which items will run out next week, an owner usually waits for someone technical, or guesses.</p>
            <p>RetailMind connects to those sources and lets the owner simply ask. Every answer comes with the query that produced it, so the number can be checked rather than trusted blindly.</p>
            <p>We start in Pakistan because that is where we are and where we can learn fastest. The goal is bigger: a tool that serves retailers in international markets too.</p>
          </div>
        </Reveal>
        <Reveal delay={0.1} className="self-start">
          <dl className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-lift">
            {FACTS.map(([k, v]) => (
              <div key={k} className="grid gap-1 px-5 py-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
                <dt className="text-[13px] text-slate-500">{k}</dt>
                <dd className="text-[14.5px] leading-snug text-slate-900">{v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      <section className="border-y border-slate-200/80 bg-white">
        <div className="mx-auto max-w-[1200px] px-5 py-20 sm:px-6 lg:py-24">
          <Reveal>
            <h2 className="max-w-[22ch] text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-slate-950 sm:text-[38px]">Where the company stands, and where it is heading</h2>
          </Reveal>
          <Stagger className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-8" gap={0.12}>
            <div className="absolute left-[7px] top-2 hidden h-[calc(100%-1rem)] w-px bg-slate-200 max-md:block" aria-hidden />
            <div className="absolute left-0 right-0 top-[7px] hidden h-px bg-slate-200 md:block" aria-hidden />
            {STAGES.map((s, i) => (
              <Item key={s.t} className="relative pl-7 md:pl-0 md:pt-8">
                <span className={`absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2 md:top-0 ${i === 0 ? "border-ink-700 bg-ink-700" : "border-slate-300 bg-white"}`} aria-hidden />
                <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-slate-900">{s.t}</h3>
                <p className="mt-2 max-w-[40ch] text-[14.5px] leading-relaxed text-slate-600">{s.b}</p>
              </Item>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="mx-auto flex max-w-[1200px] flex-col items-start gap-5 px-5 py-20 sm:px-6 md:flex-row md:items-center md:justify-between">
        <p className="max-w-[40ch] text-[22px] font-semibold leading-snug tracking-[-0.03em] text-slate-900">Read what we stand for, then meet the people building it.</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to="/vision">Vision and values</Link>
          </Button>
          <Button asChild>
            <Link to="/team">
              Meet the team <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
