import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Item, Reveal, Stagger } from "@/components/motion/primitives";
import { PageHeader } from "@/components/site/PageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";

const OBJECTIVES = [
  { t: "Build a core retailers can rely on", b: "Connect the systems a shop already uses, answer the everyday questions about sales, stock and margin, and show the query behind every answer." },
  { t: "Start with retailers in Pakistan", b: "Learn from real shops here: how they keep records, what they ask, what slows them down. Let that shape the product." },
  { t: "Take it to international markets", b: "Add currencies, languages and connectors so the same honest analytics works for retailers abroad." },
  { t: "Keep every answer checkable", b: "No number without a source. When RetailMind cannot answer a question, it says so instead of guessing." },
  { t: "Run the business with integrity", b: "Plain pricing, clear terms, and care for the data retailers entrust to us." },
];

const VALUES = [
  { term: "Sidq", name: "Honesty", b: "We show our working. Each answer opens to the SQL behind it, and we say plainly what the tool cannot do yet." },
  { term: "Amanah", name: "Trust", b: "A retailer's data is a trust. Access is read-only, hosts are masked, and the data stays the retailer's." },
  { term: "Nafʿ", name: "Benefit to people", b: "We measure ourselves by whether a shop owner makes a better decision, wastes less stock and serves customers well." },
  { term: "Itqan", name: "Excellence", b: "We take care over the small details: correct numbers, clear wording and software that works when it is needed." },
  { term: "ʿAdl", name: "Fairness", b: "Fair dealing with retailers, customers and each other, including in how we price and how we write our terms." },
];

export default function Vision() {
  usePageTitle("Vision, mission and objectives");
  return (
    <>
      <PageHeader title="Technology that serves people with honesty" intro="Our direction is shaped by Islamic values: truthfulness in trade, trustworthiness with what is entrusted to us, and benefit to the people we serve." />

      <section className="mx-auto grid max-w-[1200px] gap-14 px-5 py-20 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:py-28">
        <Reveal>
          <h2 className="text-[26px] font-semibold tracking-[-0.03em] text-slate-950">Vision</h2>
          <p className="mt-4 max-w-[46ch] text-[22px] leading-[1.35] tracking-[-0.025em] text-slate-800">
            A world where every retailer, from one neighbourhood shop to a chain in several countries, can understand its business through honest numbers it can verify.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="text-[26px] font-semibold tracking-[-0.03em] text-slate-950">Mission</h2>
          <p className="mt-4 max-w-[52ch] text-[16px] leading-relaxed text-slate-600">
            To give retailers plain-language answers about their sales, stock and margins, backed by a visible, read-only query, so decisions rest on facts. We begin in Pakistan and grow to international markets, keeping honesty and trust at the centre of how we build and how we do business.
          </p>
        </Reveal>
      </section>

      {/* HADITH */}
      <section className="border-y border-slate-200/80 bg-white">
        <Reveal className="mx-auto max-w-[900px] px-5 py-20 text-center sm:px-6 lg:py-28">
          <figure>
            <p lang="ar" dir="rtl" className="text-[38px] leading-[1.6] text-ink-800 sm:text-[52px]" style={{ fontFamily: '"Amiri", "Geeza Pro", serif' }}>
              خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ
            </p>
            <blockquote className="mx-auto mt-6 max-w-[34ch] text-[24px] font-medium leading-[1.3] tracking-[-0.03em] text-slate-900 sm:text-[30px]">
              “The best of people are those who are most beneficial to people.”
            </blockquote>
            <figcaption className="mt-6 text-[14px] leading-relaxed text-slate-500">
              The Prophet Muhammad, peace be upon him, said this. Reported by al-Daraqutni and al-Tabarani, and graded hasan.
            </figcaption>
          </figure>
          <p className="mx-auto mt-10 max-w-[56ch] text-[15px] leading-relaxed text-slate-600">
            It is the standard we hold ourselves to. If RetailMind does not help a shop owner decide better, it has not done its job.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-20 sm:px-6 lg:py-28">
        <Reveal>
          <h2 className="max-w-[20ch] text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-slate-950 sm:text-[38px]">Objectives</h2>
          <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-slate-600">What we intend to achieve. These are goals, not claims about what has already been done.</p>
        </Reveal>
        <Stagger className="mt-10 divide-y divide-slate-200 border-y border-slate-200" gap={0.08}>
          {OBJECTIVES.map((o) => (
            <Item key={o.t} className="grid gap-2 py-6 md:grid-cols-[minmax(0,380px)_minmax(0,1fr)] md:gap-10">
              <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-slate-900">{o.t}</h3>
              <p className="max-w-[60ch] text-[14.5px] leading-relaxed text-slate-600">{o.b}</p>
            </Item>
          ))}
        </Stagger>
      </section>

      <section className="border-t border-slate-200/80 bg-white">
        <div className="mx-auto max-w-[1200px] px-5 py-20 sm:px-6 lg:py-28">
          <Reveal>
            <h2 className="max-w-[22ch] text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-slate-950 sm:text-[38px]">The values we build by</h2>
            <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-slate-600">Each value is drawn from Islamic ethics of trade and shows up in a specific part of the product or the company.</p>
          </Reveal>
          <Stagger className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3" gap={0.08}>
            {VALUES.map((v) => (
              <Item key={v.term}>
                <div className="flex items-baseline gap-2.5">
                  <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-slate-900">{v.name}</h3>
                  <span className="text-[13px] italic text-ink-600">{v.term}</span>
                </div>
                <p className="mt-2 max-w-[38ch] text-[14.5px] leading-relaxed text-slate-600">{v.b}</p>
              </Item>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="mx-auto flex max-w-[1200px] flex-col items-start gap-5 px-5 py-20 sm:px-6 md:flex-row md:items-center md:justify-between">
        <p className="max-w-[36ch] text-[22px] font-semibold leading-snug tracking-[-0.03em] text-slate-900">The people responsible for turning this into a product.</p>
        <Button asChild>
          <Link to="/team">
            Meet the team <ArrowRight />
          </Link>
        </Button>
      </section>
    </>
  );
}
