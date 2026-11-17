import type { AskResult, Fallback } from "../askEngine";
import type { SqlAnswer, SummaryAnswer, AskCall } from "./aiClient";
import type { DuckLike } from "./duckTypes";
import { buildSchemaPayload, runUserQuery, SqlRejected } from "./engine";
import { buildAskResult, localSummary, parseBold } from "./present";
import { suggestQuestions } from "./suggest";
import type { TableInfo } from "./types";

export type CallFn = <T extends SqlAnswer | SummaryAnswer>(body: AskCall) => Promise<T>;
export type Phase = "sql" | "run";

export interface AskArgs {
  question: string;
  tables: TableInfo[];
  db: DuckLike;
  history: { question: string; sql?: string }[];
  call: CallFn;
  onPhase?: (p: Phase) => void;
  today?: string;
}

const fail = (message: string, tables: TableInfo[]): Fallback => ({ intent: "fallback", message, suggestions: suggestQuestions(tables, 3) });

/** Question -> AI writes SQL -> validated -> runs in the browser -> AI explains the top rows. */
export async function askUploaded(a: AskArgs): Promise<AskResult | Fallback> {
  const today = a.today ?? new Date().toISOString().slice(0, 10);
  const schema = buildSchemaPayload(a.tables);
  a.onPhase?.("sql");

  let ans: SqlAnswer;
  try {
    ans = await a.call<SqlAnswer>({ mode: "sql", question: a.question, today, schema, history: a.history });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "The AI service failed.", a.tables);
  }
  if (!ans.sql) {
    return fail(ans.reason || "I couldn't answer that from the columns in your files. Try asking about a column or metric you have.", a.tables);
  }

  a.onPhase?.("run");
  let sql = ans.sql;
  let ran: Awaited<ReturnType<typeof runUserQuery>> | null = null;
  let lastErr = "";
  for (let attempt = 0; attempt < 2 && !ran; attempt++) {
    try {
      ran = await runUserQuery(a.db, sql, a.tables);
    } catch (e) {
      lastErr = e instanceof Error ? e.message : "Query failed.";
      if (e instanceof SqlRejected || attempt === 1) break;
      // One automatic repair attempt: give the model the engine's error.
      try {
        const fixed = await a.call<SqlAnswer>({ mode: "sql", question: a.question, today, schema, history: a.history, repair: { sql, error: lastErr } });
        if (!fixed.sql) break;
        sql = fixed.sql;
        ans = { ...ans, title: fixed.title || ans.title, follow_ups: fixed.follow_ups.length ? fixed.follow_ups : ans.follow_ups };
      } catch { break; }
    }
  }
  if (!ran) return fail(`I couldn't run a valid query for that. ${lastErr}`.trim(), a.tables);

  const { result: query } = ran;
  let summary = localSummary(a.question, query);
  let followUps = ans.follow_ups;
  try {
    const top = query.rows.slice(0, 20);
    const s = await a.call<SummaryAnswer>({
      mode: "summary",
      question: a.question,
      sql: ran.sql,
      columns: query.columns.map((c) => c.name),
      rows: top,
      rowCount: query.rows.length,
      truncated: query.truncated,
    });
    const parsed = parseBold(s.summary);
    if (parsed.length) summary = parsed;
    if (s.follow_ups.length) followUps = s.follow_ups;
  } catch { /* the table, chart and SQL are still shown with a plain summary */ }

  return buildAskResult({
    id: `u${Date.now()}`,
    title: ans.title,
    question: a.question,
    summary,
    sql: ran.sql,
    query,
    followUps: followUps.length ? followUps : suggestQuestions(a.tables, 3),
    rowsScanned: a.tables.reduce((n, t) => n + t.rowCount, 0),
  });
}
