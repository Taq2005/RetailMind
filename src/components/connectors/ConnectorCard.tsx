import { motion } from "framer-motion";
import { Database, FileSpreadsheet, MoreHorizontal, RefreshCw, Snowflake, ShoppingBag, Trash2, Plug } from "lucide-react";
import { cn, fmtInt, relativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StatusDot } from "@/components/motion/primitives";
import type { Connector } from "@/data/types";

const ICON = { PostgreSQL: Database, Snowflake: Snowflake, "REST API": Plug, CSV: FileSpreadsheet } as const;
const STATUS = {
  Healthy: { tone: "good", dot: "good" },
  Syncing: { tone: "ink", dot: "info" },
  Error: { tone: "bad", dot: "bad" },
} as const;

export function ConnectorCard({ c, onRetry, onSync, onRemove, isNew }: { c: Connector; onRetry: () => void; onSync: () => void; onRemove: () => void; isNew?: boolean }) {
  const Icon = c.host_masked.includes("myshopify") ? ShoppingBag : ICON[c.type];
  const s = STATUS[c.status];
  return (
    <motion.li
      layout
      initial={isNew ? { opacity: 0, scale: 0.92, y: 14 } : false}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className={cn("group relative overflow-hidden rounded-xl border bg-white p-4 shadow-lift transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-pop", c.status === "Error" ? "border-rose-200" : "border-slate-200", isNew && "ring-2 ring-ink-300/60")}
    >
      {c.status === "Syncing" && (
        <div className="absolute inset-x-0 top-0 h-[3px] overflow-hidden bg-ink-100" aria-hidden>
          <div className="h-full w-1/3 animate-slide rounded-full bg-ink-500" />
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200 transition-colors group-hover:bg-ink-50 group-hover:text-ink-700 group-hover:ring-ink-100">
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-[14px] font-semibold tracking-[-0.015em] text-slate-900">{c.name}</h3>
            <p className="text-xs text-slate-500">{c.type}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="grid h-8 w-8 place-items-center rounded-md text-slate-400 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-700 focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100" aria-label={`Actions for ${c.name}`}>
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onSync} disabled={c.status === "Syncing"}>
              <RefreshCw /> Sync now
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onRemove} className="text-rose-600 data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-700 [&_svg]:!text-rose-400">
              <Trash2 /> Remove connector
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="mt-3 truncate font-mono text-[11.5px] text-slate-500" title="Host is masked. Credentials are never shown.">
        {c.host_masked}
      </p>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <Badge tone={s.tone}>
            <StatusDot tone={s.dot} /> {c.status}
          </Badge>
          <p className="mt-2 text-xs text-slate-500">
            {c.status === "Syncing" ? "Syncing now" : c.status === "Error" ? `Failed ${relativeTime(c.last_sync)}` : `Synced ${relativeTime(c.last_sync)}`}
          </p>
        </div>
        <div className="text-right">
          <p className="num text-[15px] font-semibold tracking-[-0.02em] text-slate-900">{fmtInt(c.row_count)}</p>
          <p className="text-xs text-slate-400">rows</p>
        </div>
      </div>

      {c.status === "Error" && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <span>401 Unauthorized. Update the API key, then retry.</span>
          <Button size="sm" variant="outline" className="h-7 shrink-0 border-rose-200 text-rose-700 hover:bg-white" onClick={onRetry}>
            <RefreshCw className="!h-3 !w-3" /> Retry
          </Button>
        </div>
      )}
    </motion.li>
  );
}
