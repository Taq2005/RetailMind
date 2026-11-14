import { cloneElement, isValidElement, useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, ChevronRight, FileUp, Lock, UploadCloud } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { DEFAULTS, KINDS, maskHost, type FormValues, type Kind, type SchemaRow } from "./connectorKinds";
import { TestConnection } from "./TestConnection";
import type { Connector } from "@/data/types";

const schemaFor = (kind: Kind) =>
  z
    .object({
      name: z.string().trim().min(2, "Give it a name of at least 2 characters").max(48, "Keep the name under 48 characters"),
      host: z.string(),
      port: z.string(),
      database: z.string(),
      user: z.string(),
      password: z.string(),
      ssl: z.boolean(),
      account: z.string(),
      warehouse: z.string(),
      shop: z.string(),
      token: z.string(),
    })
    .superRefine((v, ctx) => {
      const need = (key: keyof FormValues, msg: string, ok = String(v[key]).trim().length > 0) => {
        if (!ok) ctx.addIssue({ code: "custom", path: [key], message: msg });
      };
      if (kind === "postgres") {
        need("host", "Enter the host, for example db.example.com");
        need("host", "Host can't contain spaces or a protocol", !/\s|:\/\//.test(v.host));
        need("port", "Port must be a number from 1 to 65535", /^\d+$/.test(v.port) && +v.port >= 1 && +v.port <= 65535);
        need("database", "Enter the database name");
        need("user", "Enter a read-only user");
        need("password", "Enter the password");
      }
      if (kind === "snowflake") {
        need("account", "Enter the account identifier, for example xy12345.us-east-1");
        need("warehouse", "Enter the warehouse name");
        need("database", "Enter the database name");
        need("user", "Enter a read-only user");
        need("password", "Enter the password");
      }
      if (kind === "shopify") {
        need("shop", "Enter the shop domain, for example northwind.myshopify.com", /^[a-z0-9-]+(\.myshopify\.com)?$/i.test(v.shop.trim()));
        need("token", "Admin API tokens start with shpat_", /^shpat_[A-Za-z0-9]{8,}$/.test(v.token.trim()));
      }
    });

type Step = "type" | "configure" | "test";
const STEP_LABELS: Record<Step, string> = { type: "Source", configure: "Details", test: "Test" };

export function AddConnectorDialog({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (o: boolean) => void; onSave: (c: Omit<Connector, "id">) => void }) {
  const [step, setStep] = useState<Step>("type");
  const [dir, setDir] = useState(1);
  const [kind, setKind] = useState<Kind>("postgres");
  const [file, setFile] = useState<{ name: string; text: string; size: number } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [passed, setPassed] = useState<{ ok: boolean; schema: SchemaRow[] }>({ ok: false, schema: [] });
  const [snapshot, setSnapshot] = useState<FormValues>(DEFAULTS);
  const fileInput = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({ resolver: zodResolver(schemaFor(kind)), defaultValues: DEFAULTS, mode: "onTouched" });
  const { register, formState, reset, setValue, watch, trigger } = form;
  const { errors } = formState;

  // resolver depends on kind, so rebuild it when kind changes
  useEffect(() => {
    reset({ ...DEFAULTS, port: kind === "postgres" ? "5432" : "" });
  }, [kind, reset]);

  useEffect(() => {
    if (open) {
      setStep("type");
      setFile(null);
      setFileError(null);
      setPassed({ ok: false, schema: [] });
      reset(DEFAULTS);
    }
  }, [open, reset]);

  const go = (s: Step, d: number) => {
    setDir(d);
    setStep(s);
  };

  const readFile = (f: File | undefined) => {
    setFileError(null);
    if (!f) return;
    if (!/\.(csv|tsv|txt)$/i.test(f.name)) return setFileError("Upload a .csv, .tsv or .txt file");
    if (f.size > 25 * 1024 * 1024) return setFileError("Files over 25 MB aren't supported in the demo");
    const r = new FileReader();
    r.onload = () => {
      const text = String(r.result ?? "");
      if (!text.trim()) return setFileError("That file is empty");
      setFile({ name: f.name, text: text.slice(0, 400_000), size: f.size });
      if (!watch("name")) setValue("name", f.name.replace(/\.[^.]+$/, ""), { shouldValidate: true });
    };
    r.onerror = () => setFileError("Couldn't read that file. Try exporting it again");
    r.readAsText(f);
  };

  // Validate with the schema for the selected connector kind
  const continueFromDetails = async () => {
    const parsed = schemaFor(kind).safeParse(watch());
    if (!parsed.success) {
      parsed.error.issues.forEach((i) => form.setError(i.path[0] as keyof FormValues, { message: i.message }));
      await trigger();
      if (kind === "csv" && !file) setFileError("Choose a file to continue");
      return;
    }
    if (kind === "csv" && !file) return setFileError("Choose a file to continue");
    form.clearErrors();
    setSnapshot(parsed.data);
    setPassed({ ok: false, schema: [] });
    go("test", 1);
  };

  const save = () => {
    const info = KINDS.find((k) => k.kind === kind)!;
    const rows = kind === "csv" ? passed.schema[0]?.rows ?? 0 : passed.schema.reduce((s, r) => s + r.rows, 0);
    onSave({ name: snapshot.name.trim(), type: info.type, status: "Syncing", last_sync: new Date().toISOString(), host_masked: maskHost(snapshot, kind, file?.name), row_count: rows });
    onOpenChange(false);
  };

  const steps: Step[] = ["type", "configure", "test"];
  const idx = steps.indexOf(step);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[580px] overflow-hidden p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="border-b border-slate-100 px-6 pb-4 pt-5">
          <DialogTitle className="text-[17px] font-semibold tracking-[-0.025em] text-slate-900">Add a connector</DialogTitle>
          <DialogDescription className="mt-0.5 text-[13px] text-slate-500">RetailMind reads your data. It never writes to it.</DialogDescription>
          <ol className="mt-4 flex items-center gap-2" aria-label="Progress">
            {steps.map((s, i) => (
              <li key={s} className="flex flex-1 items-center gap-2" aria-current={i === idx ? "step" : undefined}>
                <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold transition-colors", i < idx ? "bg-ink-700 text-white" : i === idx ? "bg-ink-50 text-ink-700 ring-1 ring-ink-300" : "bg-slate-100 text-slate-400")}>
                  {i < idx ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                </span>
                <span className={cn("text-xs font-medium", i === idx ? "text-slate-900" : "text-slate-400")}>{STEP_LABELS[s]}</span>
                {i < steps.length - 1 && <span className="relative h-px flex-1 bg-slate-200"><motion.span className="absolute inset-y-0 left-0 bg-ink-600" animate={{ width: i < idx ? "100%" : "0%" }} transition={{ duration: 0.4 }} /></span>}
              </li>
            ))}
          </ol>
        </div>

        <div className="max-h-[calc(90vh-230px)] overflow-y-auto px-6 py-5 scrollbar-thin">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div key={step} custom={dir} initial={{ opacity: 0, x: dir * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -24 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
              {step === "type" && (
                <div role="radiogroup" aria-label="Connector type" className="grid gap-2.5 sm:grid-cols-2">
                  {KINDS.map((k) => {
                    const on = kind === k.kind;
                    return (
                      <button
                        key={k.kind}
                        role="radio"
                        aria-checked={on}
                        onClick={() => setKind(k.kind)}
                        className={cn("group relative flex gap-3 rounded-xl border p-3.5 text-left transition-all duration-150 active:scale-[0.985]", on ? "border-ink-400 bg-ink-50/60 shadow-[0_0_0_3px_rgb(63_79_196/.1)]" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lift")}
                      >
                        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1 ring-inset transition-colors", on ? "bg-white text-ink-700 ring-ink-200" : "bg-slate-50 text-slate-500 ring-slate-200")}>
                          <k.icon className="h-[18px] w-[18px]" />
                        </span>
                        <span>
                          <span className="block text-[13.5px] font-semibold text-slate-900">{k.label}</span>
                          <span className="mt-0.5 block text-xs leading-snug text-slate-500">{k.blurb}</span>
                        </span>
                        {on && (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 600, damping: 18 }} className="absolute right-3 top-3 grid h-4 w-4 place-items-center rounded-full bg-ink-700 text-white">
                            <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                          </motion.span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {step === "configure" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void continueFromDetails();
                  }}
                  className="space-y-4"
                  noValidate
                >
                  <Field label="Connector name" error={errors.name?.message}>
                    <Input {...register("name")} placeholder={kind === "csv" ? "POS export, Store 021" : "Prod warehouse"} aria-invalid={!!errors.name} autoComplete="off" />
                  </Field>

                  {kind === "postgres" && (
                    <>
                      <div className="grid grid-cols-[1fr_96px] gap-3">
                        <Field label="Host" error={errors.host?.message}>
                          <Input {...register("host")} placeholder="db-prod.example.com" aria-invalid={!!errors.host} autoComplete="off" spellCheck={false} />
                        </Field>
                        <Field label="Port" error={errors.port?.message}>
                          <Input {...register("port")} inputMode="numeric" aria-invalid={!!errors.port} />
                        </Field>
                      </div>
                      <Field label="Database" error={errors.database?.message}>
                        <Input {...register("database")} placeholder="retail" aria-invalid={!!errors.database} autoComplete="off" />
                      </Field>
                    </>
                  )}
                  {kind === "snowflake" && (
                    <>
                      <Field label="Account identifier" error={errors.account?.message}>
                        <Input {...register("account")} placeholder="xy12345.us-east-1" aria-invalid={!!errors.account} autoComplete="off" spellCheck={false} />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Warehouse" error={errors.warehouse?.message}>
                          <Input {...register("warehouse")} placeholder="ANALYTICS_WH" aria-invalid={!!errors.warehouse} autoComplete="off" />
                        </Field>
                        <Field label="Database" error={errors.database?.message}>
                          <Input {...register("database")} placeholder="RETAIL" aria-invalid={!!errors.database} autoComplete="off" />
                        </Field>
                      </div>
                    </>
                  )}
                  {(kind === "postgres" || kind === "snowflake") && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="User" error={errors.user?.message}>
                          <Input {...register("user")} placeholder="retailmind_readonly" aria-invalid={!!errors.user} autoComplete="off" />
                        </Field>
                        <Field label="Password" error={errors.password?.message}>
                          <Input {...register("password")} type="password" placeholder="••••••••••" aria-invalid={!!errors.password} autoComplete="new-password" />
                        </Field>
                      </div>
                      {kind === "postgres" && (
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
                          <div>
                            <Label htmlFor="ssl" className="text-[13px] text-slate-800">Require SSL</Label>
                            <p className="text-xs text-slate-500">Encrypts traffic between RetailMind and your database.</p>
                          </div>
                          <Switch id="ssl" checked={watch("ssl")} onCheckedChange={(c) => setValue("ssl", c)} />
                        </div>
                      )}
                    </>
                  )}
                  {kind === "shopify" && (
                    <>
                      <Field label="Shop domain" error={errors.shop?.message}>
                        <Input {...register("shop")} placeholder="northwind-apparel.myshopify.com" aria-invalid={!!errors.shop} autoComplete="off" spellCheck={false} />
                      </Field>
                      <Field label="Admin API access token" error={errors.token?.message} hint="Create a custom app in Shopify with read_orders, read_products and read_customers.">
                        <Input {...register("token")} type="password" placeholder="shpat_••••••••••••" aria-invalid={!!errors.token} autoComplete="new-password" />
                      </Field>
                    </>
                  )}
                  {kind === "csv" && (
                    <div>
                      <input ref={fileInput} type="file" accept=".csv,.tsv,.txt,text/csv" className="sr-only" onChange={(e) => readFile(e.target.files?.[0])} aria-label="Choose a CSV file" />
                      <button
                        type="button"
                        onClick={() => fileInput.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDrag(true);
                        }}
                        onDragLeave={() => setDrag(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDrag(false);
                          readFile(e.dataTransfer.files?.[0]);
                        }}
                        className={cn("flex w-full flex-col items-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-all", drag ? "scale-[1.01] border-ink-400 bg-ink-50" : file ? "border-emerald-300 bg-emerald-50/50" : "border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50", fileError && "border-rose-300")}
                      >
                        {file ? <FileUp className="h-6 w-6 text-emerald-600" /> : <UploadCloud className={cn("h-6 w-6 transition-transform", drag ? "-translate-y-1 text-ink-600" : "text-slate-400")} />}
                        <span className="mt-2 text-[13px] font-medium text-slate-800">{file ? file.name : drag ? "Drop to upload" : "Drag a CSV here, or browse"}</span>
                        <span className="mt-0.5 text-xs text-slate-500">{file ? `${(file.size / 1024).toFixed(1)} KB. Click to replace.` : "Header row required. Up to 25 MB."}</span>
                      </button>
                      {fileError && <p className="mt-1.5 text-xs text-rose-600" role="alert">{fileError}</p>}
                    </div>
                  )}
                  <p className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Lock className="h-3 w-3" /> Credentials are encrypted and shown masked everywhere after this step.
                  </p>
                  <button type="submit" className="sr-only">Continue</button>
                </form>
              )}

              {step === "test" && <TestConnection kind={kind} values={snapshot} file={file} onDone={(ok, schema) => setPassed({ ok, schema })} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-3.5">
          {step === "type" ? (
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          ) : (
            <Button variant="ghost" onClick={() => go(step === "test" ? "configure" : "type", -1)}>
              <ArrowLeft /> Back
            </Button>
          )}
          {step === "type" && (
            <Button onClick={() => go("configure", 1)}>
              Continue <ChevronRight />
            </Button>
          )}
          {step === "configure" && <Button onClick={() => void continueFromDetails()}>Continue to test <ChevronRight /></Button>}
          {step === "test" && (
            <Button onClick={save} disabled={!passed.ok}>
              <Check /> Save connector
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactElement<{ id?: string; "aria-describedby"?: string }> }) {
  const id = useId();
  const msgId = `${id}-msg`;
  const control = isValidElement(children) ? cloneElement(children, { id, "aria-describedby": error || hint ? msgId : undefined }) : children;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {control}
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p key="e" id={msgId} initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-rose-600" role="alert">
            {error}
          </motion.p>
        ) : hint ? (
          <p key="h" id={msgId} className="text-xs text-slate-400">{hint}</p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
