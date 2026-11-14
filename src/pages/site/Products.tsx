import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Item, Reveal, Stagger } from "@/components/motion/primitives";
import { PageHeader } from "@/components/site/PageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";

type Status = "demo" | "planned";
const FEATURES: { name: string; body: string; status: Status; to?: string }[] = [
  { name: "Ask AI", body: "Type a question about sales, stock or margin. Get a short summary, a chart, a sortable table and the read-only SQL behind it.", status: "demo", to: "/app/ask" },
  { name: "Overview dashboard", body: "Revenue, profit margin, average order value and customer retention, with category, product-velocity and low-stock views. Filter by date range and channel.", status: "demo", to: "/app" },
  { name: "Connectors", body: "Connect PostgreSQL, Snowflake, Shopify or a CSV export. The demo walks through the connection test and schema preview, though the connections themselves are simulated.", status: "demo", to: "/app/connectors" },
  { name: "Briefs and reports", body: "Pin the answers that matter and assemble them into a one-page brief with figures, a chart and recommended actions for the buying team.", status: "planned" },
];

const SERVICES = [
  { name: "Setup and onboarding", body: "Help a retailer connect their point-of-sale, online store and spreadsheets, and check that the numbers match their own records." },
  { name: "Team training", body: "Short sessions that teach shop and buying teams which questions to ask and how to read the SQL behind an answer." },
  { name: "Connectors for local systems", body: "Build connectors for the point-of-sale and stock systems retailers actually use in each new market." },
];

export default function Products() {
  usePageTitle("Products and services");
  return (
    <>
      <PageHeader title="A platform for asking questions of your retail data" intro="One product, RetailMind, and a few services to help retailers get started with it. Each item below says whether it works in the demo today or is still planned." />

      <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-6 lg:py-24">
        <Reveal>
          <h2 className="text-[30px] font-semibold tracking-[-0.035em] text-slate-950 sm:text-[38px]">The RetailMind platform</h2>
        </Reveal>
        <Stagger className="mt-10 divide-y divide-slate-200 border-y border-slate-200" gap={0.08}>
          {FEATURES.map((f) => (
            <Item key={f.name} className="grid items-start gap-3 py-6 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)_auto] md:gap-10">
              <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-slate-900">{f.name}</h3>
              <p className="max-w-[62ch] text-[14.5px] leading-relaxed text-slate-600">{f.body}</p>
              <div className="flex items-center gap-3 md:justify-end">
                <Badge tone={f.status === "demo" ? "good" : "neutral"}>{f.status === "demo" ? "Works in the demo" : "Planned"}</Badge>
                {f.to && (
                  <Link to={f.to} className="text-[13px] font-medium text-ink-700 underline-offset-4 hover:underline">
                    Try it
                  </Link>
                )}
              </div>
            </Item>
          ))}
        </Stagger>
      </section>

      <section className="border-y border-slate-200/80 bg-white">
        <div className="mx-auto grid max-w-[1200px] gap-12 px-5 py-16 sm:px-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-16 lg:py-24">
          <Reveal>
            <h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] text-slate-950 sm:text-[34px]">Services we propose to offer</h2>
            <p className="mt-3 max-w-[34ch] text-[15px] leading-relaxed text-slate-600">Software alone does not fix messy records. These services are proposed and are not yet running.</p>
          </Reveal>
          <Stagger className="grid gap-x-10 gap-y-8 sm:grid-cols-2" gap={0.1}>
            {SERVICES.map((s) => (
              <Item key={s.name} className={s.name === SERVICES[2].name ? "sm:col-span-2" : ""}>
                <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-slate-900">{s.name}</h3>
                <p className="mt-2 max-w-[52ch] text-[14.5px] leading-relaxed text-slate-600">{s.body}</p>
              </Item>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] gap-12 px-5 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <Reveal>
          <h2 className="text-[30px] font-semibold tracking-[-0.035em] text-slate-950 sm:text-[34px]">Who it is for</h2>
          <p className="mt-4 max-w-[50ch] text-[16px] leading-relaxed text-slate-600">Retailers: owners, buyers and store managers who sell through a shop, an online store or both. We are starting with apparel and electronics, and with retailers in Pakistan, because that is where we can learn the most.</p>
          <p className="mt-4 max-w-[50ch] text-[16px] leading-relaxed text-slate-600">The aim is international: the same tool for retailers in other countries, once we have learned from the first.</p>
        </Reveal>
        <Reveal delay={0.1} className="self-center">
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-lift">
            <p className="text-[18px] font-semibold leading-snug tracking-[-0.025em] text-slate-900">See the platform working on a sample retailer.</p>
            <p className="mt-2 text-[14px] leading-relaxed text-slate-500">The demo uses synthetic data. No sign-up.</p>
            <Button asChild className="mt-5">
              <Link to="/app">
                Open the demo <ArrowRight />
              </Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
