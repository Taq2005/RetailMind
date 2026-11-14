import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Download } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatCell, toCsv, type AskResult } from "@/data/askEngine";

export function ResultTable({ result }: { result: AskResult }) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const rows = useMemo(() => {
    if (!sort) return result.rows;
    return [...result.rows].sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y))) * sort.dir;
    });
  }, [result, sort]);

  const toggle = (key: string) => setSort((s) => (!s || s.key !== key ? { key, dir: -1 } : s.dir === -1 ? { key, dir: 1 } : null));

  const exportCsv = () => {
    const blob = new Blob([toCsv(result)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `retailmind-${result.intent}-2026-11-14.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("CSV exported", { description: `${result.rows.length} rows from "${result.title}"` });
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          <span className="num font-medium text-slate-700">{result.rows.length}</span> rows. Click a column to sort.
        </p>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download /> Export CSV
        </Button>
      </div>
      <div className="max-h-[360px] overflow-auto rounded-lg border border-slate-200 scrollbar-thin">
        <table className="w-full border-separate border-spacing-0 text-[13px]">
          <thead>
            <tr>
              {result.columns.map((c) => {
                const on = sort?.key === c.key;
                return (
                  <th key={c.key} scope="col" aria-sort={on ? (sort!.dir === 1 ? "ascending" : "descending") : "none"} className={cn("sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 p-0 backdrop-blur", c.align === "right" && "text-right")}>
                    <button onClick={() => toggle(c.key)} className={cn("group inline-flex w-full items-center gap-1 whitespace-nowrap px-2.5 py-2 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900", c.align === "right" && "justify-end")}>
                      {c.label}
                      <motion.span key={String(on) + sort?.dir} initial={{ opacity: 0, y: sort?.dir === 1 ? 4 : -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className={cn(on ? "text-ink-700" : "text-slate-300 group-hover:text-slate-500")}>
                        {on ? sort!.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3" />}
                      </motion.span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <motion.tr key={String(r[result.columns[0].key])} layout="position" transition={{ type: "spring", stiffness: 500, damping: 40 }} className="group">
                {result.columns.map((c) => (
                  <td key={c.key} className={cn("whitespace-nowrap border-b border-slate-100 px-2.5 py-2 text-slate-700 transition-colors group-hover:bg-slate-50 group-last:border-b-0", c.align === "right" && "num text-right", i === 0 && !sort && c === result.columns[0] && "font-medium text-slate-900")}>
                    {formatCell(r[c.key], c.format)}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
