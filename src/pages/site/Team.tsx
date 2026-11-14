import { Item, Reveal, Stagger } from "@/components/motion/primitives";
import { PageHeader } from "@/components/site/PageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";

const TEAM = [
  {
    initials: "MT",
    name: "M. Taqi Siddiqui",
    role: "Chief Executive Officer (CEO)",
    does: ["Sets the company direction and product priorities", "Leads the plan for entering international markets", "Represents RetailMind to retailers and partners"],
    goal: "Take RetailMind from Pakistani retailers to international markets without losing the honesty the product is built on.",
  },
  {
    initials: "SW",
    name: "Syed Wahaaj Ali",
    role: "Co-founder and Chief Technology Officer (CTO)",
    does: ["Designs the platform and its data connectors", "Owns query safety, security and performance", "Leads engineering and technical decisions"],
    goal: "Make every answer fast, correct and verifiable, with read-only access that retailers can trust.",
  },
  {
    initials: "UN",
    name: "Uzair Nadeem",
    role: "Chief Financial Officer (CFO)",
    does: ["Plans the budget, pricing and financial model", "Keeps the company's accounts clear and compliant", "Tracks costs as the product grows into new markets"],
    goal: "Keep pricing fair and the company sustainable, with accounts that are open and honest.",
  },
  {
    initials: "AK",
    name: "Abdullah Khan",
    role: "Chief Marketing Officer (CMO)",
    does: ["Shapes the brand and how RetailMind is explained", "Researches retailers' needs, in Pakistan first and then abroad", "Leads outreach and communication with retailers"],
    goal: "Earn retailers' trust through clear, truthful communication about what the product does and does not do.",
  },
];

export default function Team() {
  usePageTitle("Team");
  return (
    <>
      <PageHeader title="The people building RetailMind" intro="Four team members, each responsible for one part of turning an idea for honest retail analytics into a company." />

      <section className="mx-auto max-w-[1200px] px-5 py-8 sm:px-6 lg:py-14">
        <Stagger className="divide-y divide-slate-200" gap={0.1}>
          {TEAM.map((m) => (
            <Item key={m.name} className="grid gap-6 py-10 lg:grid-cols-[minmax(0,330px)_minmax(0,1fr)_minmax(0,1fr)] lg:gap-10 lg:py-12">
              <div className="flex items-center gap-4 lg:items-start">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-ink-600 to-ink-800 text-[20px] font-semibold tracking-tight text-white shadow-pop" aria-hidden>
                  {m.initials}
                </span>
                <div>
                  <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.03em] text-slate-950">{m.name}</h2>
                  <p className="mt-1 max-w-[26ch] text-[14px] leading-snug text-slate-500">{m.role}</p>
                </div>
              </div>
              <div>
                <h3 className="text-[13px] font-medium text-slate-500">Responsibilities</h3>
                <ul className="mt-3 space-y-2.5">
                  {m.does.map((d) => (
                    <li key={d} className="flex gap-2.5 text-[14.5px] leading-snug text-slate-700">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ink-400" aria-hidden />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-[13px] font-medium text-slate-500">Professional objective</h3>
                <p className="mt-3 max-w-[40ch] text-[15px] leading-relaxed text-slate-800">{m.goal}</p>
              </div>
            </Item>
          ))}
        </Stagger>
        <Reveal className="border-t border-slate-200 pt-6">
          <p className="max-w-[62ch] text-[13.5px] leading-relaxed text-slate-500">Roles and objectives describe what each person is responsible for at RetailMind.</p>
        </Reveal>
      </section>
    </>
  );
}
