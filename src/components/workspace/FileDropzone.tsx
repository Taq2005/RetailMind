import { useCallback, useRef, useState } from "react";
import { FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ACCEPT_ATTR } from "@/data/workspace/files";
import { useWorkspace } from "@/data/workspace/WorkspaceContext";

export function FileDropzone({ compact = false, className }: { compact?: boolean; className?: string }) {
  const ws = useWorkspace();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const working = ws.processing.length > 0;

  const handle = useCallback(
    async (list: FileList | File[] | null) => {
      const files = list ? Array.from(list) : [];
      if (!files.length) return;
      const outcomes = await ws.addFiles(files);
      for (const o of outcomes) {
        if (!o.ok) toast.error(o.fileName, { description: o.message });
        else if (o.message) toast.warning(o.fileName, { description: o.message });
        else toast.success(`${o.fileName} is ready`, { description: `${o.tables?.length ?? 1} table${(o.tables?.length ?? 1) > 1 ? "s" : ""} loaded. Ask a question about it.` });
      }
    },
    [ws],
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); void handle(e.dataTransfer.files); }}
      className={cn(
        "rounded-xl border border-dashed bg-white/70 text-center transition-[border-color,background-color,box-shadow] duration-200",
        over ? "border-ink-400 bg-ink-50/70 shadow-[0_0_0_4px_rgb(63_79_196/.08)]" : "border-slate-300 hover:border-slate-400",
        compact ? "px-5 py-6" : "px-6 py-10",
        className,
      )}
    >
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPT_ATTR}
        className="sr-only"
        aria-label="Choose files to upload"
        onChange={(e) => { void handle(e.target.files); e.target.value = ""; }}
      />
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-ink-50 text-ink-700 ring-1 ring-ink-100">
        {working ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
      </span>
      <p className="mt-3 text-sm font-medium text-slate-900">{working ? `Reading ${ws.processing[0]}…` : "Drop your sales files here"}</p>
      <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-slate-500">CSV, TSV or Excel (.xlsx), up to 50 MB each. You can add several files and ask across them.</p>
      <button
        type="button"
        disabled={working}
        onClick={() => input.current?.click()}
        className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-ink-700 px-3.5 text-[13px] font-medium text-white shadow-[0_1px_0_rgb(255_255_255/.18)_inset,0_1px_2px_rgb(18_23_68/.4)] transition-all hover:bg-ink-600 active:scale-[0.97] disabled:opacity-60"
      >
        <FileSpreadsheet className="h-4 w-4" /> Choose files
      </button>
    </div>
  );
}
