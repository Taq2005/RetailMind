import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileSpreadsheet, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/data/workspace/WorkspaceContext";
import { safeObjectName } from "@/data/workspace/storage";

const fmtSize = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : n >= 1024 ? `${Math.round(n / 1024)} KB` : n ? `${n} B` : "");

export function FileList() {
  const ws = useWorkspace();
  const [confirm, setConfirm] = useState<string | null>(null);
  const names = new Set([...ws.files.map((f) => f.name), ...ws.tables.map((t) => t.fileName)]);
  const rows = [...names].map((name) => ({
    name,
    size: ws.files.find((f) => f.name === name || safeObjectName(f.name) === name)?.size ?? 0,
    tables: ws.tables.filter((t) => t.fileName === name),
  }));
  if (!rows.length) return null;

  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lift">
      <AnimatePresence initial={false}>
        {rows.map((r) => (
          <motion.li key={r.name} layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 px-4 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"><FileSpreadsheet className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-medium text-slate-900">{r.name}</p>
              <p className="truncate text-xs text-slate-500">
                {r.tables.length
                  ? r.tables.map((t) => `${t.name}: ${t.rowCount.toLocaleString("en-US")} rows, ${t.columns.length} columns`).join(" · ")
                  : "Not loaded"}
                {fmtSize(r.size) ? ` · ${fmtSize(r.size)}` : ""}
              </p>
            </div>
            {confirm === r.name ? (
              <span className="flex items-center gap-1.5 text-xs">
                <button onClick={() => { setConfirm(null); void ws.removeFile(r.name).then(() => toast(`${r.name} removed`)); }} className="rounded-md bg-rose-600 px-2.5 py-1 font-medium text-white transition-all hover:bg-rose-700 active:scale-95">Delete</button>
                <button onClick={() => setConfirm(null)} className="rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100">Cancel</button>
              </span>
            ) : (
              <button onClick={() => setConfirm(r.name)} aria-label={`Remove ${r.name}`} className="grid h-8 w-8 place-items-center rounded-md text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-90">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
