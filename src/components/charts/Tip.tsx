import type { ReactNode } from "react";

export interface TipRow {
  color: string;
  label: string;
  value: string;
}
/** Shared tooltip chrome: used by every Recharts tooltip in the app. */
export function TipCard({ title, rows, footer }: { title: ReactNode; rows: TipRow[]; footer?: ReactNode }) {
  return (
    <div className="min-w-[160px] rounded-lg border border-slate-200 bg-white/95 px-3 py-2.5 text-xs shadow-[0_12px_32px_-12px_rgb(15_23_42/.3)] backdrop-blur">
      <div className="mb-1.5 font-medium text-slate-900">{title}</div>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-5">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="h-2 w-2 rounded-[3px]" style={{ background: r.color }} />
              {r.label}
            </span>
            <span className="num font-medium text-slate-900">{r.value}</span>
          </li>
        ))}
      </ul>
      {footer && <div className="mt-1.5 border-t border-slate-100 pt-1.5 text-slate-500">{footer}</div>}
    </div>
  );
}
