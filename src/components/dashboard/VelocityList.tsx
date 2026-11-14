import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { VelocityRow } from "@/data/selectors";
import { fmtInt } from "@/lib/utils";

export function VelocityList({ rows }: { rows: VelocityRow[] }) {
  const max = Math.max(...rows.map((r) => r.unitsPerWeek), 1);
  return (
    <ol className="space-y-3.5">
      {rows.map((r, i) => (
        <li key={r.id}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-[13px]">
            <span className="flex min-w-0 items-center gap-2">
              <span className="num w-4 text-xs text-slate-400">{i + 1}</span>
              <span className="truncate font-medium text-slate-800">{r.name}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {r.low ? (
                <Badge tone="bad">Below reorder</Badge>
              ) : (
                <span className="num text-xs text-slate-400">{r.coverWeeks.toFixed(1)} wks cover</span>
              )}
              <span className="num w-16 text-right font-medium text-slate-900">
                {fmtInt(r.unitsPerWeek)}
                <span className="text-xs font-normal text-slate-400">/wk</span>
              </span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-ink-700 to-ink-400"
              initial={{ width: 0 }}
              whileInView={{ width: `${(r.unitsPerWeek / max) * 100}%` }}
              viewport={{ once: true, margin: "-10% 0px" }}
              animate={{ width: `${(r.unitsPerWeek / max) * 100}%` }}
              transition={{ duration: 0.9, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
