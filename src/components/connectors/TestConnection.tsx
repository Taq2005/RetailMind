import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, CircleDashed, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn, fmtInt, sleep } from "@/lib/utils";
import { hashMs, previewSchema, type FormValues, type Kind, type SchemaRow } from "./connectorKinds";

type State = "idle" | "running" | "ok" | "fail";
interface Check {
  label: string;
  state: "todo" | "run" | "ok" | "fail";
  detail?: string;
}

function baseChecks(kind: Kind): string[] {
  if (kind === "csv") return ["Read file", "Detect delimiter and encoding", "Infer column types", "Preview rows"];
  if (kind === "shopify") return ["Resolve shop domain", "TLS handshake", "Authenticate with access token", "Read API scopes", "Introspect resources"];
  return ["Resolve host (DNS)", "TCP connect", "TLS handshake", "Authenticate", "Introspect schema"];
}

export function TestConnection({ kind, values, file, onDone }: { kind: Kind; values: FormValues; file: { name: string; text: string } | null; onDone: (ok: boolean, schema: SchemaRow[]) => void }) {
  const [state, setState] = useState<State>("idle");
  const [checks, setChecks] = useState<Check[]>(() => baseChecks(kind).map((label) => ({ label, state: "todo" })));
  const [failAuth, setFailAuth] = useState(false);
  const [schema, setSchema] = useState<SchemaRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const hostKey = kind === "postgres" ? values.host : kind === "snowflake" ? values.account : kind === "shopify" ? values.shop : file?.name ?? "";

  const run = async () => {
    setState("running");
    setError(null);
    setSchema([]);
    onDone(false, []);
    const labels = baseChecks(kind);
    const set = (i: number, c: Partial<Check>) => setChecks((prev) => prev.map((x, k) => (k === i ? { ...x, ...c } : x)));
    setChecks(labels.map((label) => ({ label, state: "todo" })));

    // csv: real parsing of the uploaded header row
    let csvSchema: SchemaRow[] = [];
    let csvRows = 0;
    const details: (() => string)[] = [];
    if (kind === "csv") {
      const lines = (file?.text ?? "").split(/\r?\n/).filter(Boolean);
      const delim = [",", ";", "\t", "|"].map((d) => [d, (lines[0] ?? "").split(d).length] as const).sort((a, b) => b[1] - a[1])[0][0];
      const head = (lines[0] ?? "").split(delim).map((h) => h.trim().replace(/^"|"$/g, ""));
      const sample = lines.slice(1, 6).map((l) => l.split(delim));
      csvRows = Math.max(0, lines.length - 1);
      const inferType = (idx: number) => {
        const vals = sample.map((r) => (r[idx] ?? "").trim()).filter(Boolean);
        if (!vals.length) return "text";
        if (vals.every((v) => /^-?\d+$/.test(v))) return "integer";
        if (vals.every((v) => /^-?\$?\d+(\.\d+)?$/.test(v))) return "numeric";
        if (vals.every((v) => /^\d{4}-\d{2}-\d{2}/.test(v))) return "timestamp";
        return "text";
      };
      csvSchema = head.map((h, i) => ({ table: h || `column_${i + 1}`, columns: inferType(i), rows: csvRows }));
      details.push(() => `${((file?.text.length ?? 0) / 1024).toFixed(1)} KB`, () => `${delim === "\t" ? "Tab" : `"${delim}"`}, UTF-8`, () => `${head.length} columns`, () => `${csvRows.toLocaleString("en-US")} data rows`);
    }

    const ping = hashMs(hostKey || "x", 9, 38);
    const proto = "TLSv1.3";
    const cipher = "TLS_AES_256_GCM_SHA384";
    const seq: { ms: number; detail: () => string; fail?: string }[] =
      kind === "csv"
        ? labels.map((_, i) => ({ ms: 380, detail: details[i] }))
        : kind === "shopify"
        ? [
            { ms: 420, detail: () => `${hashMs(hostKey, 6, 20)} ms` },
            { ms: 520, detail: () => `${proto}, ${cipher}` },
            { ms: 620, detail: () => "Token accepted", fail: failAuth ? "401 Unauthorized: invalid access token for this shop." : undefined },
            { ms: 420, detail: () => "read_orders, read_products, read_customers" },
            { ms: 700, detail: () => `${previewSchema("shopify").length} resources` },
          ]
        : [
            { ms: 420, detail: () => `Resolved to 10.24.${hashMs(hostKey, 1, 200)}.${hashMs(hostKey + "x", 2, 250)} in ${hashMs(hostKey, 3, 12)} ms` },
            { ms: 560, detail: () => `${ping} ms round trip` },
            { ms: 560, detail: () => (values.ssl ? `${proto}, ${cipher}` : "Skipped (SSL off)") },
            { ms: 640, detail: () => `Signed in as ${values.user || "readonly"}`, fail: failAuth ? `password authentication failed for user "${values.user || "readonly"}"` : undefined },
            { ms: 780, detail: () => `${previewSchema(kind).length} tables found` },
          ];

    for (let i = 0; i < seq.length; i++) {
      if (!alive.current) return;
      set(i, { state: "run" });
      await sleep(seq[i].ms);
      if (!alive.current) return;
      if (seq[i].fail) {
        set(i, { state: "fail", detail: seq[i].fail });
        setError(seq[i].fail!);
        setState("fail");
        return;
      }
      set(i, { state: "ok", detail: seq[i].detail() });
    }
    const result = kind === "csv" ? csvSchema : previewSchema(kind);
    setSchema(result);
    setState("ok");
    onDone(true, result);
  };

  return (
    <div>
      <ul className="space-y-1 rounded-xl border border-slate-200 bg-slate-50/60 p-2">
        {checks.map((c) => (
          <li key={c.label} className={cn("flex items-start gap-3 rounded-lg px-2.5 py-2 transition-colors", c.state === "run" && "bg-white shadow-sm", c.state === "fail" && "bg-rose-50")}>
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center">
              {c.state === "todo" && <CircleDashed className="h-4 w-4 text-slate-300" />}
              {c.state === "run" && <Loader2 className="h-4 w-4 animate-spin text-ink-600" />}
              {c.state === "ok" && (
                <motion.span initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 600, damping: 16 }} className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                </motion.span>
              )}
              {c.state === "fail" && <AlertCircle className="h-4 w-4 text-rose-600" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn("block text-[13px]", c.state === "todo" ? "text-slate-400" : "font-medium text-slate-800")}>{c.label}</span>
              <AnimatePresence>
                {c.detail && (
                  <motion.span initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className={cn("block font-mono text-[11.5px]", c.state === "fail" ? "text-rose-700" : "text-slate-500")}>
                    {c.detail}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </li>
        ))}
      </ul>

      {state === "fail" && error && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-800">
          <p className="font-medium">Connection failed at authentication</p>
          <p className="mt-0.5 text-rose-700">Check the credentials on the previous step, or turn off the simulated failure and run the test again.</p>
        </motion.div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {kind !== "csv" ? (
          <div className="flex items-center gap-2">
            <Switch id="fail" checked={failAuth} onCheckedChange={setFailAuth} disabled={state === "running"} />
            <Label htmlFor="fail" className="text-slate-500">Simulate an authentication failure</Label>
          </div>
        ) : (
          <span />
        )}
        <Button onClick={run} disabled={state === "running"} variant={state === "ok" ? "outline" : "default"} size="sm">
          {state === "running" ? <Loader2 className="animate-spin" /> : state === "idle" ? null : <RotateCcw />}
          {state === "idle" ? "Run test" : state === "running" ? "Testing" : "Run test again"}
        </Button>
      </div>

      <AnimatePresence>
        {state === "ok" && schema.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="mt-5">
            <h4 className="mb-2 text-[13px] font-semibold text-slate-900">{kind === "csv" ? "Detected columns" : "Schema preview"}</h4>
            <div className="max-h-[220px] overflow-auto rounded-lg border border-slate-200 scrollbar-thin">
              <table className="w-full table-fixed text-left text-[12.5px]">
                <colgroup>{kind === "csv" ? <><col className="w-1/2" /><col className="w-1/2" /></> : <><col className="w-[34%]" /><col className="w-[46%]" /><col className="w-[20%]" /></>}</colgroup>
                <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">{kind === "csv" ? "Column" : "Table"}</th>
                    <th className="px-3 py-2 font-medium">{kind === "csv" ? "Type" : "Columns"}</th>
                    {kind !== "csv" && <th className="px-3 py-2 text-right font-medium">Rows</th>}
                  </tr>
                </thead>
                <tbody>
                  {schema.map((r, i) => (
                    <motion.tr key={r.table + i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }} className="border-t border-slate-100">
                      <td className="truncate px-3 py-2 font-mono text-slate-800" title={r.table}>{r.table}</td>
                      <td className="truncate px-3 py-2 text-slate-500" title={r.columns}>{r.columns}</td>
                      {kind !== "csv" && <td className="num px-3 py-2 text-right text-slate-700">{fmtInt(r.rows)}</td>}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
