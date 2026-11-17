import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/data/workspace/WorkspaceContext";
import { FileDropzone } from "./FileDropzone";
import { PrivacyNote } from "./PrivacyNote";

/** Shown wherever an account has no data yet. */
export function UploadPrompt({ title = "Upload your sales data to get started", lead }: { title?: string; lead?: string }) {
  const ws = useWorkspace();
  if (ws.status === "loading" && !ws.tables.length) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-sm text-slate-500" aria-busy="true">
        <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading your data…</span>
      </div>
    );
  }
  return (
    <div className="mx-auto grid min-h-[65vh] max-w-[620px] place-items-center px-5 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="w-full text-center">
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.035em] text-slate-900">{title}</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
          {lead ?? "Add a CSV or Excel export, then ask questions in plain English. RetailMind writes the SQL, runs it on your file and shows the answer with a chart."}
        </p>
        <FileDropzone className="mt-6" />
        {ws.status === "error" && ws.error && (
          <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-left text-xs text-rose-700">
            {ws.error} <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => void ws.reload()}>Try again</Button>
          </p>
        )}
        <PrivacyNote className="mt-5 text-left" />
      </motion.div>
    </div>
  );
}
