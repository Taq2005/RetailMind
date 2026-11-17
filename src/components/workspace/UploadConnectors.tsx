import { motion } from "framer-motion";
import { Database, ShoppingBag, Snowflake } from "lucide-react";
import { useWorkspace } from "@/data/workspace/WorkspaceContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileDropzone } from "./FileDropzone";
import { FileList } from "./FileList";
import { PrivacyNote } from "./PrivacyNote";

const PLANNED = [
  { name: "PostgreSQL", icon: Database, note: "Read-only connection to your database." },
  { name: "Snowflake", icon: Snowflake, note: "Query your warehouse directly." },
  { name: "Shopify", icon: ShoppingBag, note: "Pull orders and products from your store." },
];

/** Connectors page for regular accounts: real file upload, plus honest "coming soon" cards. */
export function UploadConnectors() {
  const ws = useWorkspace();
  return (
    <div className="mx-auto max-w-[900px] px-4 pb-16 pt-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.035em] text-slate-900">Connect your data</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">Upload files and Ask AI can answer questions about them right away.</p>
        </div>
        {ws.tables.length > 0 && (
          <Button asChild size="lg" className="h-10"><Link to="/app/ask">Ask a question</Link></Button>
        )}
      </motion.div>

      <div className="mt-6 space-y-4">
        <FileDropzone compact={ws.tables.length > 0} />
        {ws.error && <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{ws.error}</p>}
        <FileList />
        <PrivacyNote />
      </div>

      <h2 className="mt-10 text-sm font-semibold text-slate-900">More connectors</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-3">
        {PLANNED.map((p) => (
          <li key={p.name} className="rounded-xl border border-slate-200 bg-white/70 p-4">
            <div className="flex items-center justify-between">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500"><p.icon className="h-4 w-4" /></span>
              <Badge>Coming soon</Badge>
            </div>
            <p className="mt-3 text-[13.5px] font-medium text-slate-800">{p.name}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{p.note}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
