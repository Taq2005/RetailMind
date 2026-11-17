import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, PlugZap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CountUp, Item, Stagger, StatusDot } from "@/components/motion/primitives";
import { ConnectorCard } from "@/components/connectors/ConnectorCard";
import { AddConnectorDialog } from "@/components/connectors/AddConnectorDialog";
import { CONNECTORS } from "@/data/seed";
import type { Connector } from "@/data/types";
import { cn, sleep } from "@/lib/utils";
import { useAuth } from "@/auth/AuthContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { isDemoEmail } from "@/config";
import { UploadConnectors } from "@/components/workspace/UploadConnectors";

/** The original simulated connectors, kept for the sample demo account only. */
function SimulatedConnectors() {
  const { user } = useAuth();
  const isDemoAccount = isDemoEmail(user?.email);
  const accountId = user?.id ?? "anonymous";
  const storageKey = isDemoAccount ? `rm.demo.${accountId}.connectors` : `rm.account.${accountId}.connectors`;
  const [list, setList] = useLocalStorage<Connector[]>(storageKey, isDemoAccount ? CONNECTORS : []);
  const [open, setOpen] = useState(false);
  const [fresh, setFresh] = useState<number | null>(null);

  const update = (id: number, p: Partial<Connector>) => setList((l) => l.map((c) => (c.id === id ? { ...c, ...p } : c)));

  const runSync = async (c: Connector) => {
    update(c.id, { status: "Syncing" });
    await sleep(2600);
    update(c.id, { status: "Healthy", last_sync: new Date().toISOString(), row_count: c.row_count + Math.round(c.row_count * 0.0004) + 12 });
    toast.success(`${c.name} synced`);
  };

  const healthy = list.filter((c) => c.status === "Healthy").length;
  const syncing = list.filter((c) => c.status === "Syncing").length;
  const errors = list.filter((c) => c.status === "Error").length;
  const pct = list.length ? (healthy / list.length) * 100 : 0;

  const add = (c: Omit<Connector, "id">) => {
    const id = Math.max(0, ...list.map((x) => x.id)) + 1;
    const created = { ...c, id };
    setList((l) => [created, ...l]);
    setFresh(id);
    toast.success(`${c.name} added`, { description: "First sync started. Ask AI can read it once it completes." });
    setTimeout(() => update(id, { status: "Healthy", last_sync: new Date().toISOString() }), 3200);
    setTimeout(() => setFresh(null), 3500);
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-16 pt-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.035em] text-slate-900">Connectors</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">Where RetailMind reads from. Every connection is read-only and its host is masked.</p>
        </div>
        <Button onClick={() => setOpen(true)} size="lg" className="h-10">
          <Plus /> Add connector
        </Button>
      </motion.div>

      <Stagger className="mt-6 grid gap-4 sm:grid-cols-3" gap={0.08}>
        <Item className="rounded-xl border border-slate-200 bg-white p-4 shadow-lift">
          <p className="text-[13px] font-medium text-slate-500">Total sources</p>
          <p className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.035em] text-slate-900"><CountUp value={list.length} /></p>
          <p className="mt-3 text-xs text-slate-400">PostgreSQL, Snowflake, REST and CSV</p>
        </Item>
        <Item className="rounded-xl border border-slate-200 bg-white p-4 shadow-lift">
          <p className="text-[13px] font-medium text-slate-500">Active syncs</p>
          <p className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.035em] text-slate-900"><CountUp value={syncing} /></p>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">{syncing > 0 ? <><StatusDot tone="info" /> Running now</> : "Nothing running"}</p>
        </Item>
        <Item className="rounded-xl border border-slate-200 bg-white p-4 shadow-lift">
          <p className="text-[13px] font-medium text-slate-500">Health status</p>
          <p className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.035em] text-slate-900"><CountUp value={pct} format={(n) => `${Math.round(n)}%`} /></p>
          <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden>
            <motion.div className="bg-emerald-500" animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 200, damping: 28 }} />
            <motion.div className="bg-ink-400" animate={{ width: `${list.length ? (syncing / list.length) * 100 : 0}%` }} transition={{ type: "spring", stiffness: 200, damping: 28 }} />
            <motion.div className="bg-rose-500" animate={{ width: `${list.length ? (errors / list.length) * 100 : 0}%` }} transition={{ type: "spring", stiffness: 200, damping: 28 }} />
          </div>
          <p className={cn("mt-2 text-xs", errors ? "text-rose-600" : "text-slate-400")}>{healthy} healthy{errors ? `, ${errors} needs attention` : ""}</p>
        </Item>
      </Stagger>

      {list.length === 0 ? (
        <div className="mt-8 grid place-items-center rounded-xl border border-dashed border-slate-300 bg-white/60 px-6 py-20 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink-50 text-ink-700 ring-1 ring-ink-100"><PlugZap className="h-5 w-5" /></span>
          <h2 className="mt-4 text-base font-semibold text-slate-900">No connectors yet</h2>
          <p className="mt-1.5 max-w-sm text-sm text-slate-500">Connect a database, Shopify store or CSV export so Ask AI has something to read.</p>
          <Button className="mt-5" onClick={() => setOpen(true)}><Plus /> Add connector</Button>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {list.map((c) => (
              <ConnectorCard
                key={c.id}
                c={c}
                isNew={fresh === c.id}
                onSync={() => void runSync(c)}
                onRetry={() => void runSync(c)}
                onRemove={() => {
                  setList((l) => l.filter((x) => x.id !== c.id));
                  toast(`${c.name} removed`, { action: { label: "Undo", onClick: () => setList((l) => [c, ...l]) } });
                }}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}

      <AddConnectorDialog open={open} onOpenChange={setOpen} onSave={add} />
    </div>
  );
}

export default function Connectors() {
  const { user } = useAuth();
  return isDemoEmail(user?.email) ? <SimulatedConnectors /> : <UploadConnectors />;
}
