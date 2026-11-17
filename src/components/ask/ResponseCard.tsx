import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Copy, Database, Gauge, HardDrive, ShieldCheck, Terminal } from "lucide-react";
import { toast } from "sonner";
import type { AskResult, Seg } from "@/data/askEngine";
import { SqlHighlight } from "./SqlHighlight";
import { ResultChart } from "./ResultChart";
import { ResultTable } from "./ResultTable";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function Summary({ parts, className }: { parts: Seg[]; className?: string }) {
  return (
    <p className={cn("text-[14px] leading-relaxed text-slate-700", className)}>
      {parts.map((p, i) =>
        typeof p === "string" ? <span key={i}>{p}</span> : (
          <strong key={i} className="num rounded-[3px] bg-ink-50 font-semibold text-ink-800 shadow-[0_0_0_2px_#F1F3FD]">
            {p.b}
          </strong>
        )
      )}
    </p>
  );
}

export function ResponseCard({ result }: { result: AskResult }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error("Couldn't copy. Select the SQL and copy it manually.");
    }
  };
  return (
    <article className="space-y-5">
      <header>
        <h2 className="text-[17px] font-semibold tracking-[-0.025em] text-slate-900">{result.title}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone="good"><ShieldCheck className="h-3 w-3" /> Read-only</Badge>
          <Badge><Gauge className="h-3 w-3" /> {result.latencyMs}ms</Badge>
          <Badge><Database className="h-3 w-3" /> {result.rowsScanned.toLocaleString("en-US")} rows scanned</Badge>
          {result.engine === "upload" && <Badge><HardDrive className="h-3 w-3" /> Ran in your browser</Badge>}
          {result.truncated && <Badge tone="warn">Showing first {result.rows.length.toLocaleString("en-US")} rows</Badge>}
        </div>
      </header>

      <div className="rounded-xl border border-ink-100 bg-gradient-to-b from-ink-50/70 to-white p-4">
        <Summary parts={result.summary} />
      </div>

      {result.chart && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-lift">
          <ResultChart spec={result.chart} />
        </section>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lift">
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50">
          <span className="flex items-center gap-2 text-[13px] font-medium text-slate-800">
            <Terminal className="h-4 w-4 text-slate-400" /> Inspect SQL
          </span>
          <span className="flex items-center gap-2 text-xs text-slate-400">
            {open ? "Hide" : `${result.sql.split("\n").length} lines`}
            <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", open && "rotate-180")} />
          </span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
              <div className="border-t border-slate-200 bg-[#0F1330]">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
                  <span className="flex items-center gap-2 text-[11px] text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" /> {result.engine === "upload" ? "SELECT only. Runs on your file in this browser" : "SELECT only. Runs as retailmind_readonly"}
                  </span>
                  <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white active:scale-95">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy SQL"}
                  </button>
                </div>
                <SqlHighlight sql={result.sql} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-lift">
        <ResultTable result={result} />
      </section>
    </article>
  );
}
