import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Check, FilePlus2, Loader2, MessageSquareText, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { cn, sleep } from "@/lib/utils";
import { answer, SUGGESTED_PROMPTS, type AskResult, type Fallback } from "@/data/askEngine";
import { loadDB } from "@/data/seed";
import { Summary, ResponseCard } from "@/components/ask/ResponseCard";
import { Skeleton } from "@/components/motion/primitives";
import { useDB } from "@/hooks/useDB";
import { PrivacyNote } from "@/components/workspace/PrivacyNote";
import { UploadPrompt } from "@/components/workspace/UploadPrompt";
import { useWorkspace } from "@/data/workspace/WorkspaceContext";
import { askUploaded } from "@/data/workspace/askUploaded";
import { callAsk } from "@/data/workspace/aiClient";
import { suggestQuestions } from "@/data/workspace/suggest";

type Step = "schema" | "sql" | "run";
interface UserMsg {
  id: string;
  role: "user";
  text: string;
}
interface BotMsg {
  id: string;
  role: "assistant";
  question: string;
  step: Step | "stream" | "done";
  result?: AskResult;
  fallback?: Fallback;
  /** fraction of summary revealed while streaming, 0..1 */
  reveal: number;
  vote?: "up" | "down";
  pinned?: boolean;
}
type Msg = UserMsg | BotMsg;

const STEP_LABEL: Record<Step, string> = { schema: "Reading your schema", sql: "Writing read-only SQL", run: "Running the query" };
const STEPS: Step[] = ["schema", "sql", "run"];
let uid = 0;
const nextId = () => `m${++uid}`;

export default function AskAI() {
  const { isDemoAccount } = useDB();
  const ws = useWorkspace();
  const hasData = isDemoAccount || ws.tables.length > 0;
  const prompts = useMemo(() => (isDemoAccount ? SUGGESTED_PROMPTS : suggestQuestions(ws.tables, 6)), [isDemoAccount, ws.tables]);
  const msgsRef = useRef<Msg[]>([]);
  const [params, setParams] = useSearchParams();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bootstrapped = useRef(false);

  msgsRef.current = msgs;
  const patch = useCallback((id: string, p: Partial<BotMsg>) => setMsgs((m) => m.map((x) => (x.id === id && x.role === "assistant" ? { ...x, ...p } : x))), []);

  const ask = useCallback(
    async (q: string) => {
      const question = q.trim();
      if (!hasData || !question || busy) return;
      setBusy(true);
      setDraft("");
      const u: UserMsg = { id: nextId(), role: "user", text: question };
      const b: BotMsg = { id: nextId(), role: "assistant", question, step: "schema", reveal: 0 };
      setMsgs((m) => [...m, u, b]);
      let res: AskResult | Fallback;
      if (isDemoAccount) {
        const dbPromise = loadDB();
        await sleep(420);
        patch(b.id, { step: "sql" });
        await sleep(480);
        patch(b.id, { step: "run" });
        const db = await dbPromise;
        await sleep(520);
        res = answer(db, question);
      } else {
        const history = msgsRef.current
          .filter((x): x is BotMsg => x.role === "assistant" && !!x.result)
          .slice(-3)
          .map((x) => ({ question: x.question, sql: x.result!.sql }));
        await sleep(300);
        res = ws.db
          ? await askUploaded({ question, tables: ws.tables, db: ws.db, history, call: callAsk, onPhase: (p) => patch(b.id, { step: p }) })
          : { intent: "fallback", message: "Your data engine is still starting. Try again in a moment.", suggestions: [] };
      }
      if (res.intent === "fallback") {
        patch(b.id, { step: "done", fallback: res as Fallback, reveal: 1 });
        setBusy(false);
        return;
      }
      const result = res as AskResult;
      patch(b.id, { step: "stream", result });
      setSelected(b.id);
      const total = result.summary.reduce<number>((n, s) => n + (typeof s === "string" ? s.length : s.b.length), 0);
      const t0 = performance.now();
      const dur = Math.min(2600, 500 + total * 7);
      await new Promise<void>((resolve) => {
        const tick = () => {
          const f = Math.min(1, (performance.now() - t0) / dur);
          patch(b.id, { reveal: f });
          if (f < 1) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
      patch(b.id, { step: "done", reveal: 1 });
      setBusy(false);
    },
    [busy, isDemoAccount, hasData, patch, ws.db, ws.tables]
  );

  // Deep link from search / dashboard: /app/ask?q=...
  useEffect(() => {
    const q = params.get("q");
    if (q && !bootstrapped.current) {
      bootstrapped.current = true;
      setParams({}, { replace: true });
      void ask(q);
    }
  }, [params, setParams, ask]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs.length, msgs[msgs.length - 1]?.role === "assistant" ? (msgs[msgs.length - 1] as BotMsg).step : ""]);

  const selectedMsg = useMemo(() => msgs.find((m): m is BotMsg => m.role === "assistant" && m.id === selected && !!m.result), [msgs, selected]);
  const empty = msgs.length === 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void ask(draft);
  };

  if (!hasData) return <UploadPrompt title="Upload a file to start asking" />;

  return (
    <div className="mx-auto grid max-w-[1400px] gap-0 px-0 lg:h-[calc(100vh-3.5rem)] lg:grid-cols-[minmax(380px,440px)_minmax(0,1fr)]">
      {/* LEFT: thread */}
      <section className="flex min-h-[calc(100vh-3.5rem)] flex-col border-slate-200 lg:min-h-0 lg:border-r" aria-label="Conversation">
        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin sm:px-6">
          {empty ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
              <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.035em] text-slate-900">{isDemoAccount ? "Ask about your stores, SKUs and customers" : "Ask about your data"}</h1>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                {isDemoAccount
                  ? "Questions run as read-only SQL on Northwind Apparel & Tech. You can inspect every query before trusting the answer."
                  : `Questions become read-only SQL that runs on ${ws.tables.length === 1 ? "your file" : "your files"} in this browser. You can inspect every query before trusting the answer.`}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {prompts.map((p, i) => (
                  <motion.button
                    key={p}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => void ask(p)}
                    className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-left text-[13px] text-slate-700 shadow-sm transition-[box-shadow,border-color,color] hover:border-ink-200 hover:text-ink-800 hover:shadow-[0_8px_20px_-10px_rgb(38_48_127/.35)]"
                  >
                    {p}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <ol className="space-y-5">
              {msgs.map((m) =>
                m.role === "user" ? (
                  <motion.li key={m.id} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 420, damping: 32 }} className="flex justify-end">
                    <p className="max-w-[88%] rounded-2xl rounded-br-md bg-ink-700 px-3.5 py-2.5 text-[13.5px] leading-snug text-white shadow-[0_6px_16px_-8px_rgb(38_48_127/.6)]">{m.text}</p>
                  </motion.li>
                ) : (
                  <BotBubble
                    key={m.id}
                    m={m}
                    active={selected === m.id}
                    onSelect={() => setSelected(m.id)}
                    onVote={(v) => {
                      patch(m.id, { vote: m.vote === v ? undefined : v });
                      if (m.vote !== v) toast(v === "up" ? "Thanks, marked as helpful" : "Thanks, we'll review this answer");
                    }}
                    onPin={() => {
                      patch(m.id, { pinned: !m.pinned });
                      toast.success(m.pinned ? "Removed from report" : "Pinned to Weekly brief", { description: m.result?.title });
                    }}
                    onFollowUp={(q) => void ask(q)}
                    disabled={busy}
                  />
                )
              )}
              <div ref={endRef} />
            </ol>
          )}
        </div>

        <form onSubmit={onSubmit} className="border-t border-slate-200 bg-white/70 p-3 backdrop-blur sm:p-4">
          <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm transition-[border-color,box-shadow] focus-within:border-ink-400 focus-within:ring-4 focus-within:ring-ink-100">
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void ask(draft);
                }
              }}
              rows={1}
              placeholder="Ask a question about your data"
              aria-label="Ask a question"
              className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent px-2.5 py-2 text-[13.5px] text-slate-900 outline-none placeholder:text-slate-400"
            />
            <button type="submit" disabled={!draft.trim() || busy} aria-label="Send question" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-700 text-white transition-all hover:bg-ink-600 active:scale-90 disabled:bg-slate-200 disabled:text-slate-400">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 px-1 text-[11px] text-slate-400">Enter to send, Shift+Enter for a new line</p>
          {!isDemoAccount && <PrivacyNote className="mt-1.5 px-1 text-[11px]" />}
        </form>
      </section>

      {/* RIGHT: inspector */}
      <section className="min-w-0 overflow-y-auto bg-slate-50/60 px-4 py-6 scrollbar-thin sm:px-8" aria-label="Result inspector">
        <AnimatePresence mode="wait">
          {selectedMsg?.result ? (
            <motion.div key={selectedMsg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="mx-auto max-w-[860px]">
              <ResponseCard result={selectedMsg.result} />
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto grid min-h-[320px] max-w-[860px] place-items-center">
              {busy ? (
                <div className="w-full space-y-4">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-[280px] w-full rounded-xl" />
                </div>
              ) : (
                <div className="max-w-xs text-center">
                  <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-400 shadow-lift ring-1 ring-slate-200">
                    <MessageSquareText className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-sm font-medium text-slate-800">Results appear here</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-500">Pick a suggested question. You get a summary, a chart, the SQL behind it and a table you can export.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}

function BotBubble({ m, active, onSelect, onVote, onPin, onFollowUp, disabled }: { m: BotMsg; active: boolean; onSelect: () => void; onVote: (v: "up" | "down") => void; onPin: () => void; onFollowUp: (q: string) => void; disabled: boolean }) {
  const thinking = m.step === "schema" || m.step === "sql" || m.step === "run";
  const visible = useMemo(() => {
    if (!m.result) return [];
    const total = m.result.summary.reduce<number>((n, s) => n + (typeof s === "string" ? s.length : s.b.length), 0);
    let left = Math.floor(total * m.reveal);
    const out: typeof m.result.summary = [];
    for (const s of m.result.summary) {
      const text = typeof s === "string" ? s : s.b;
      if (left <= 0) break;
      const cut = text.slice(0, left);
      left -= text.length;
      out.push(typeof s === "string" ? cut : { b: cut });
    }
    return out;
  }, [m.result, m.reveal]);

  return (
    <motion.li initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 420, damping: 32 }} className="flex gap-3">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ink-700 text-[11px] font-semibold text-white">R</span>
      <div className="min-w-0 flex-1">
        {thinking && (
          <ul className="space-y-1.5 text-[13px]" aria-live="polite">
            {STEPS.map((s, i) => {
              const cur = STEPS.indexOf(m.step as Step);
              const state = i < cur ? "done" : i === cur ? "now" : "todo";
              return (
                <li key={s} className={cn("flex items-center gap-2 transition-opacity", state === "todo" ? "opacity-0" : "opacity-100", state === "done" ? "text-slate-400" : "text-slate-700")}>
                  {state === "done" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-600" />}
                  {STEP_LABEL[s]}
                </li>
              );
            })}
          </ul>
        )}

        {m.fallback && (
          <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white p-3.5 shadow-sm">
            <p className="text-[13.5px] leading-relaxed text-slate-700">{m.fallback.message}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {m.fallback.suggestions.map((s) => (
                <button key={s} disabled={disabled} onClick={() => onFollowUp(s)} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 transition-all hover:-translate-y-0.5 hover:border-ink-200 hover:text-ink-800 active:scale-95 disabled:opacity-50">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {m.result && (
          <div className={cn("rounded-2xl rounded-tl-md border bg-white p-3.5 shadow-sm transition-[border-color,box-shadow]", active ? "border-ink-300 shadow-[0_0_0_3px_rgb(63_79_196/.08)]" : "border-slate-200")}>
            <Summary parts={visible} />
            {m.step === "stream" && <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-caret bg-ink-600" />}
            {m.step === "done" && (
              <>
                <button onClick={onSelect} className={cn("mt-3 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-all active:scale-[0.99]", active ? "border-ink-200 bg-ink-50 text-ink-800" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white")}>
                  <span className="font-medium">{m.result.title}</span>
                  <span className="num shrink-0 pl-3 text-slate-400">{m.result.rows.length} rows, {m.result.latencyMs}ms</span>
                </button>
                <div className="mt-2.5 flex flex-wrap items-center gap-1">
                  <IconBtn label="Helpful" on={m.vote === "up"} onClick={() => onVote("up")}>
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </IconBtn>
                  <IconBtn label="Not helpful" on={m.vote === "down"} onClick={() => onVote("down")}>
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </IconBtn>
                  <button onClick={onPin} className={cn("inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-all active:scale-95", m.pinned ? "bg-ink-50 text-ink-800" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800")}>
                    <FilePlus2 className="h-3.5 w-3.5" /> {m.pinned ? "Pinned to report" : "Pin to report"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {m.step === "done" && m.result && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {m.result.followUps.map((f) => (
              <button key={f} disabled={disabled} onClick={() => onFollowUp(f)} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-ink-200 hover:text-ink-800 active:scale-95 disabled:opacity-50">
                {f}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.li>
  );
}

function IconBtn({ label, on, onClick, children }: { label: string; on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} aria-pressed={on} className={cn("grid h-7 w-7 place-items-center rounded-md transition-all active:scale-90", on ? "bg-ink-50 text-ink-700" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700")}>
      {children}
    </button>
  );
}
