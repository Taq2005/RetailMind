import { tableToRows } from "./arrowConvert";
import type { DuckLike } from "./duckTypes";
import { columnNames, qi, tableNameFor, uniqueNames } from "./names";
import { profileTable } from "./profile";
import type { TableInfo } from "./types";

export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_COLUMNS = 200;

export class IngestError extends Error {}

/* ---------------------------------------------------------------- decoding */

export function decodeText(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    text = new TextDecoder("windows-1252").decode(bytes);
  }
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** Excel cell values to CSV text so every format goes through one ingest path. */
function csvEscape(v: unknown): string {
  if (v == null) return "";
  let s: string;
  if (v instanceof Date) s = Number.isNaN(v.getTime()) ? "" : v.toISOString().replace(/T00:00:00\.000Z$/, "").replace(/\.000Z$/, "").replace("T", " ");
  else if (typeof v === "boolean") s = v ? "true" : "false";
  else s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function rowsToCsv(rows: unknown[][]): string {
  const width = rows.reduce((m, r) => Math.max(m, r.length), 0);
  return rows.map((r) => Array.from({ length: width }, (_, i) => csvEscape(r[i])).join(",")).join("\n");
}

/** Pick the delimiter that appears most (outside quotes) on the first non-empty line. */
export function detectDelimiter(text: string): string {
  const line = text.split(/\r?\n/).find((l) => l.trim()) ?? "";
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0, "|": 0 };
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (!inQ && ch in counts) counts[ch]++;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][1] > 0
    ? Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
    : ",";
}

/* ----------------------------------------------------------- type inference */

const RX_NUM = "^-?[0-9]*[.]?[0-9]+([eE][-+]?[0-9]+)?$";
const RX_INT = "^-?[0-9]+$";
const RX_LEAD0 = "^-?0[0-9]";
const RX_ISO_DATE = "^[0-9]{4}-[0-9]{2}-[0-9]{2}$";
const RX_ISO_TS = "^[0-9]{4}-[0-9]{2}-[0-9]{2}[ T][0-9]{2}:[0-9]{2}(:[0-9]{2}([.][0-9]+)?)?$";
const RX_DMY = "^[0-9]{1,2}[/.-][0-9]{1,2}[/.-][0-9]{4}$";

type Inferred =
  | { kind: "BOOLEAN" | "BIGINT" | "DOUBLE" | "DATE" | "TIMESTAMP" | "VARCHAR"; expr: (c: string) => string };

const trimmed = (c: string) => `NULLIF(TRIM(${qi(c)}), '')`;
const stripped = (c: string) => `REPLACE(REPLACE(${trimmed(c)}, ',', ''), ' ', '')`;

/** Decide the best type per column from the raw all-text table, in a single scan. */
async function inferTypes(db: DuckLike, raw: string, cols: string[]): Promise<Inferred[]> {
  const parts: string[] = [];
  cols.forEach((c, i) => {
    const t = trimmed(c);
    const s = stripped(c);
    parts.push(
      `count(${t}) AS nn${i}`,
      `count(*) FILTER (WHERE lower(${t}) IN ('true','false')) AS b${i}`,
      `count(*) FILTER (WHERE regexp_matches(${s}, '${RX_INT}') AND NOT regexp_matches(${s}, '${RX_LEAD0}') AND length(${s}) <= 18) AS i${i}`,
      `count(*) FILTER (WHERE regexp_matches(${s}, '${RX_NUM}') AND NOT regexp_matches(${s}, '${RX_LEAD0}')) AS d${i}`,
      `count(*) FILTER (WHERE regexp_matches(${t}, '${RX_ISO_DATE}') AND TRY_CAST(${t} AS DATE) IS NOT NULL) AS dt${i}`,
      `count(*) FILTER (WHERE regexp_matches(${t}, '${RX_ISO_TS}') AND TRY_CAST(${t} AS TIMESTAMP) IS NOT NULL) AS ts${i}`,
      `count(*) FILTER (WHERE regexp_matches(${t}, '${RX_DMY}') AND TRY_STRPTIME(REPLACE(REPLACE(${t}, '-', '/'), '.', '/'), '%d/%m/%Y') IS NOT NULL) AS dmy${i}`,
    );
  });
  const res = tableToRows(await db.query(`SELECT ${parts.join(", ")} FROM ${qi(raw)}`)).rows[0] ?? {};
  return cols.map((c, i) => {
    const n = (k: string) => Number(res[`${k}${i}`] ?? 0);
    const nn = n("nn");
    if (nn === 0) return { kind: "VARCHAR", expr: trimmed };
    if (n("b") === nn) return { kind: "BOOLEAN", expr: (x) => `TRY_CAST(lower(${trimmed(x)}) AS BOOLEAN)` };
    if (n("i") === nn) return { kind: "BIGINT", expr: (x) => `TRY_CAST(${stripped(x)} AS BIGINT)` };
    if (n("d") === nn) return { kind: "DOUBLE", expr: (x) => `TRY_CAST(${stripped(x)} AS DOUBLE)` };
    if (n("dt") === nn) return { kind: "DATE", expr: (x) => `TRY_CAST(${trimmed(x)} AS DATE)` };
    if (n("ts") === nn || n("dt") + n("ts") === nn) return { kind: "TIMESTAMP", expr: (x) => `TRY_CAST(${trimmed(x)} AS TIMESTAMP)` };
    if (n("dmy") === nn) return { kind: "DATE", expr: (x) => `CAST(TRY_STRPTIME(REPLACE(REPLACE(${trimmed(x)}, '-', '/'), '.', '/'), '%d/%m/%Y') AS DATE)` };
    return { kind: "VARCHAR", expr: trimmed };
  });
}

/* ------------------------------------------------------------------ ingest */

export interface IngestInput {
  fileName: string;
  sheet?: string;
  /** CSV text, with a header row. */
  csv: string;
}

export async function ingestCsv(db: DuckLike, input: IngestInput, takenTables: Iterable<string>): Promise<TableInfo> {
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const file = `up_${stamp}.csv`;
  const raw = `raw_${stamp}`;
  await db.registerText(file, input.csv);
  try {
    // Read everything as text first so we can infer types ourselves (keeps leading zeros, handles "1,200").
    await db.query(
      `CREATE TEMP TABLE ${qi(raw)} AS SELECT * FROM read_csv('${file}', header=true, delim='${detectDelimiter(input.csv) === "\t" ? "\\t" : detectDelimiter(input.csv)}', quote='"', escape='"', all_varchar=true, ` +
        `ignore_errors=true, null_padding=true, strict_mode=false, sample_size=-1)`,
    );
    const described = tableToRows(await db.query(`DESCRIBE ${qi(raw)}`)).rows;
    const origCols = described.map((r) => String(r.column_name));
    if (!origCols.length) throw new IngestError("No columns found in this file.");
    if (origCols.length > MAX_COLUMNS) throw new IngestError(`This file has ${origCols.length} columns. The limit is ${MAX_COLUMNS}.`);

    const names = columnNames(origCols);
    const types = await inferTypes(db, raw, origCols);
    const table = tableNameFor(input.fileName, input.sheet, takenTables);

    const select = origCols.map((c, i) => `${types[i].expr(c)} AS ${qi(names[i])}`).join(", ");
    await db.query(`CREATE TABLE ${qi(table)} AS SELECT ${select} FROM ${qi(raw)}`);

    const count = Number(tableToRows(await db.query(`SELECT count(*) AS n FROM ${qi(table)}`)).rows[0].n);
    if (count === 0) {
      await db.query(`DROP TABLE ${qi(table)}`);
      throw new IngestError("This file has a header but no data rows.");
    }

    const info: TableInfo = {
      name: table,
      fileName: input.fileName,
      sheet: input.sheet,
      rowCount: count,
      columns: origCols.map((orig, i) => ({
        name: names[i],
        original: orig,
        type: types[i].kind,
        kind: types[i].kind === "VARCHAR" ? "text" : types[i].kind === "BOOLEAN" ? "bool" : types[i].kind === "DATE" || types[i].kind === "TIMESTAMP" ? "date" : "number",
        examples: [],
      })),
    };
    await profileTable(db, info);
    return info;
  } finally {
    await db.query(`DROP TABLE IF EXISTS ${qi(raw)}`).catch(() => {});
    await db.dropFile(file).catch(() => {});
  }
}

/** Header row detection: skip leading empty rows, make blank headers readable. */
export function prepareSheetRows(data: unknown[][]): unknown[][] {
  const rows = data.filter((r) => Array.isArray(r));
  const firstIdx = rows.findIndex((r) => r.some((c) => c != null && String(c).trim() !== ""));
  if (firstIdx < 0) return [];
  const body = rows.slice(firstIdx);
  const width = body.reduce((m, r) => Math.max(m, r.length), 0);
  const header = Array.from({ length: width }, (_, i) => {
    const h = body[0][i];
    return h == null || String(h).trim() === "" ? `column_${i + 1}` : String(h);
  });
  return [header, ...body.slice(1)];
}

export async function ingestExcelSheets(
  db: DuckLike,
  fileName: string,
  sheets: { sheet: string; data: unknown[][] }[],
  taken: Iterable<string>,
): Promise<TableInfo[]> {
  const out: TableInfo[] = [];
  const used = new Set<string>(taken);
  for (const s of sheets) {
    const rows = prepareSheetRows(s.data);
    if (rows.length < 2) continue;
    const info = await ingestCsv(db, { fileName, sheet: sheets.length > 1 ? s.sheet : undefined, csv: rowsToCsv(rows) }, used);
    used.add(info.name);
    out.push(info);
  }
  if (!out.length) throw new IngestError("No sheet with data was found in this workbook.");
  return out;
}

export { uniqueNames };
