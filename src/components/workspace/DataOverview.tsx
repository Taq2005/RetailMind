import { motion } from "framer-motion";
import { ArrowRight, Table2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/data/workspace/WorkspaceContext";
import { suggestQuestions } from "@/data/workspace/suggest";
import type { ColumnInfo, TableInfo } from "@/data/workspace/types";
import { UploadPrompt } from "./UploadPrompt";

const n = (v: number) => v.toLocaleString("en-US");

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-lift">
      <p className="text-[13px] font-medium text-slate-500">{label}</p>
      <p className="num mt-1 text-[28px] font-semibold leading-none tracking-[-0.035em] text-slate-900">{value}</p>
    </div>
  );
}

function ColumnRow({ c, rows }: { c: ColumnInfo; rows: number }) {
  const p = c.profile;
  const missing = p && rows ? (p.nulls / rows) * 100 : 0;
  const detail =
    c.kind === "text" && p?.top.length
      ? p.top.slice(0, 3).map((t) => t.value).join(", ")
      : p?.min != null && p.max != null && p.min !== p.max
        ? `${p.min} → ${p.max}`
        : (c.examples[0] ?? "");
  return (
    <tr className="group">
      <td className="border-b border-slate-100 px-3 py-2 font-mono text-[12px] text-slate-800 group-last:border-b-0">{c.name}</td>
      <td className="border-b border-slate-100 px-3 py-2 group-last:border-b-0"><Badge>{c.type.toLowerCase()}</Badge></td>
      <td className="num border-b border-slate-100 px-3 py-2 text-right text-slate-600 group-last:border-b-0">{p ? n(p.distinct) : ""}</td>
      <td className={`num border-b border-slate-100 px-3 py-2 text-right group-last:border-b-0 ${missing > 20 ? "font-medium text-amber-700" : "text-slate-600"}`}>{missing ? `${missing.toFixed(missing < 10 ? 1 : 0)}%` : "0%"}</td>
      <td className="max-w-[260px] truncate border-b border-slate-100 px-3 py-2 text-slate-500 group-last:border-b-0" title={detail}>{detail}</td>
    </tr>
  );
}

function TableCard({ t }: { t: TableInfo }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lift">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Table2 className="h-4 w-4 shrink-0 text-slate-400" />
          <h3 className="truncate font-mono text-[13px] font-medium text-slate-900">{t.name}</h3>
          <span className="truncate text-xs text-slate-400">from {t.fileName}{t.sheet ? ` / ${t.sheet}` : ""}</span>
        </div>
        <span className="num text-xs text-slate-500">{n(t.rowCount)} rows · {t.columns.length} columns</span>
      </header>
      <div className="max-h-[340px] overflow-auto scrollbar-thin">
        <table className="w-full border-separate border-spacing-0 text-[13px]">
          <thead>
            <tr className="text-left text-xs font-medium text-slate-500">
              {["Column", "Type", "Distinct", "Missing", "Values"].map((h, i) => (
                <th key={h} scope="col" className={`sticky top-0 border-b border-slate-200 bg-slate-50/95 px-3 py-2 backdrop-blur ${i === 2 || i === 3 ? "text-right" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>{t.columns.map((c) => <ColumnRow key={c.name} c={c} rows={t.rowCount} />)}</tbody>
        </table>
      </div>
    </section>
  );
}

/** Overview for accounts using uploaded data: what is in the files and what to ask. */
export function DataOverview() {
  const ws = useWorkspace();
  if (!ws.tables.length) return <UploadPrompt />;
  const rows = ws.tables.reduce((s, t) => s + t.rowCount, 0);
  const cols = ws.tables.reduce((s, t) => s + t.columns.length, 0);
  const files = new Set(ws.tables.map((t) => t.fileName)).size;
  const questions = suggestQuestions(ws.tables, 6);
  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.035em] text-slate-900">Your data</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">What RetailMind sees in your files. Check column types and gaps before you ask.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/app/connectors">Manage files</Link></Button>
          <Button asChild><Link to="/app/ask">Ask a question <ArrowRight /></Link></Button>
        </div>
      </motion.div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Files" value={n(files)} />
        <Stat label="Tables" value={n(ws.tables.length)} />
        <Stat label="Rows" value={n(rows)} />
        <Stat label="Columns" value={n(cols)} />
      </div>

      {ws.error && <p role="alert" className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{ws.error}</p>}

      {questions.length > 0 && (
        <div className="mt-6 rounded-xl border border-ink-100 bg-gradient-to-b from-ink-50/70 to-white p-4">
          <p className="text-[13px] font-medium text-slate-800">Try asking</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {questions.map((q) => (
              <Link key={q} to={`/app/ask?q=${encodeURIComponent(q)}`} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[13px] text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-ink-200 hover:text-ink-800 active:scale-95">
                {q}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {ws.tables.map((t) => <TableCard key={t.name} t={t} />)}
      </div>
    </div>
  );
}
