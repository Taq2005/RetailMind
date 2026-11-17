import type { AskResult, ChartSpec, Column, Seg } from "../askEngine";
import { prettyLabel } from "./names";
import type { QueryResult, ResultColumn } from "./types";

const MAX_CHART_POINTS = 60;
const SHARE_WORDS = /share|percent|pct|mix|distribution|split|proportion/i;

/** "Total **1,200** from **Ali**." -> segments for the Summary component. Plain text only. */
export function parseBold(text: string): Seg[] {
  const out: Seg[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push({ b: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.map((s) => (typeof s === "string" ? s.replace(/\*+/g, "") : s)).filter((s) => (typeof s === "string" ? s : s.b));
}

export function toColumns(cols: ResultColumn[]): Column[] {
  return cols.map((c) => ({
    key: c.name,
    label: prettyLabel(c.name),
    format: c.kind === "number" ? "num" : c.kind === "date" && /^Date/i.test(c.type) ? "date" : "text",
    align: c.kind === "number" ? "right" : "left",
  }));
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** Choose a chart from the shape of the result. Returns null when none fits. */
export function pickChart(columns: ResultColumn[], rows: QueryResult["rows"]): ChartSpec | null {
  if (rows.length < 2) return null;
  const measures = columns.filter((c) => c.kind === "number");
  const dims = columns.filter((c) => c.kind === "date" || c.kind === "text");
  if (!measures.length || !dims.length) return null;

  // Prefer a date dimension for trends, otherwise the first text column.
  const dim = dims.find((d) => d.kind === "date") ?? dims[0];
  // A numeric column that looks like an id is not a useful measure.
  const useful = measures.filter((m) => !/(^|_)(id|code|zip|phone)$/i.test(m.name));
  const pool = useful.length ? useful : measures;
  const peak = (m: ResultColumn) => Math.max(0, ...rows.map((r) => Math.abs(num(r[m.name]) ?? 0)));
  // Keep only measures on a similar scale as the first one, so a small count isn't squashed next to big totals.
  const ms = pool.filter((m, i) => i === 0 || (peak(m) > 0 && peak(pool[0]) / peak(m) < 20 && peak(m) / peak(pool[0]) < 20)).slice(0, 3);
  if (!ms.length) return null;

  const labelOf = (v: unknown) => (v == null ? "(none)" : String(v));
  const shown = rows.slice(0, MAX_CHART_POINTS);
  const data = shown.map((r) => {
    const d: Record<string, string | number> = { [dim.name]: labelOf(r[dim.name]) };
    for (const m of ms) d[m.name] = num(r[m.name]) ?? 0;
    return d;
  });
  const series = ms.map((m) => ({ key: m.name, label: prettyLabel(m.name) }));

  if (dim.kind === "date") {
    if (rows.length < 3) return null;
    const sorted = [...data].sort((a, b) => String(a[dim.name]).localeCompare(String(b[dim.name])));
    return { kind: "line", xKey: dim.name, series, data: sorted, yFormat: "num" };
  }

  if (ms.length === 1) {
    const m = ms[0];
    const allPos = shown.every((r) => (num(r[m.name]) ?? 0) >= 0);
    if (shown.length <= 6 && allPos && SHARE_WORDS.test(m.name + " " + dim.name)) {
      return { kind: "donut", data: shown.map((r) => ({ name: labelOf(r[dim.name]), value: num(r[m.name]) ?? 0 })), unit: "num", centerLabel: prettyLabel(m.name) };
    }
    const maxLabel = Math.max(...shown.map((r) => labelOf(r[dim.name]).length));
    if (shown.length > 7 || maxLabel > 14) {
      const top = data.slice(0, 12);
      return { kind: "hbar", labelKey: dim.name, valueKey: m.name, valueLabel: prettyLabel(m.name), data: top, yFormat: "num" };
    }
  }
  return { kind: "bar", xKey: dim.name, series, data: data.slice(0, 24), yFormat: "num" };
}

/** Plain-language fallback when the AI summary call fails. */
export function localSummary(question: string, q: QueryResult): Seg[] {
  if (q.rows.length === 0) return ["No matching data was found for this question."];
  const fmt = (v: unknown) => (typeof v === "number" ? v.toLocaleString("en-US", { maximumFractionDigits: 2 }) : String(v ?? ""));
  if (q.rows.length === 1) {
    const r = q.rows[0];
    const parts = q.columns.slice(0, 4).flatMap((c, i): Seg[] => [i ? ", " : "", `${c.name.replace(/_/g, " ")}: `, { b: fmt(r[c.name]) }]);
    return parts;
  }
  return [`The query returned `, { b: q.rows.length.toLocaleString("en-US") + (q.truncated ? "+" : "") }, ` rows. See the table and SQL below.`];
}

export function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "result";
}

export function buildAskResult(args: {
  id: string;
  title: string;
  question: string;
  summary: Seg[];
  sql: string;
  query: QueryResult;
  followUps: string[];
  rowsScanned: number;
}): AskResult {
  const { query } = args;
  return {
    id: args.id,
    intent: slug(args.title || args.question),
    title: args.title,
    summary: args.summary,
    chart: pickChart(query.columns, query.rows),
    sql: args.sql,
    columns: toColumns(query.columns),
    rows: query.rows.map((r) => {
      const o: Record<string, string | number> = {};
      for (const c of query.columns) o[c.name] = r[c.name] ?? "";
      return o;
    }),
    latencyMs: query.ms,
    rowsScanned: args.rowsScanned,
    followUps: args.followUps,
    engine: "upload",
    truncated: query.truncated,
    totalRows: query.rows.length,
  };
}
