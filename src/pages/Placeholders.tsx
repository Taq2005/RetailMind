import { Link } from "react-router-dom";
import { BarChart3, Database, FileText, Settings as SettingsIcon, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/primitives";

const COPY: Record<string, { icon: LucideIcon; title: string; body: string; cta: string; to: string }> = {
  sources: { icon: Database, title: "Data sources", body: "Tables and views exposed to Ask AI will be listed here, with column descriptions and row-level access rules. Connect a source first, then choose what Ask AI may read.", cta: "Open connectors", to: "/app/connectors" },
  analytics: { icon: BarChart3, title: "Analytics", body: "Saved cohorts, funnels and margin waterfalls will live here. For now, ask a question and pin the result.", cta: "Ask a question", to: "/app/ask" },
  reports: { icon: FileText, title: "Reports", body: "Weekly briefs and pinned answers collect here, ready to send to merchandising. Pin a result from Ask AI to start your first report.", cta: "Go to Ask AI", to: "/app/ask" },
  settings: { icon: SettingsIcon, title: "Settings", body: "Workspace members, roles, query limits and the read-only database role are managed here. Nothing to change yet in this demo workspace.", cta: "Back to overview", to: "/app" },
};

export default function Placeholders({ kind }: { kind: keyof typeof COPY }) {
  const c = COPY[kind];
  const Icon = c.icon;
  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-16 pt-8 sm:px-6">
      <h1 className="text-[26px] font-semibold tracking-[-0.035em] text-slate-900">{c.title}</h1>
      <Reveal className="mt-8 grid place-items-center rounded-xl border border-dashed border-slate-300 bg-white/60 px-6 py-24 text-center">
        <div className="max-w-md">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-ink-50 text-ink-700 ring-1 ring-ink-100">
            <Icon className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-base font-semibold text-slate-900">Nothing here yet</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{c.body}</p>
          <Button asChild className="mt-5">
            <Link to={c.to}>{c.cta}</Link>
          </Button>
        </div>
      </Reveal>
    </div>
  );
}
