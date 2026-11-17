import type { CellValue, ColKind, ResultColumn } from "./types";

/* Apache Arrow Type ids (stable numeric enum), avoiding a direct dependency on apache-arrow. */
const T = { Int: 2, Float: 3, Utf8: 5, Bool: 6, Decimal: 7, Date: 8, Time: 9, Timestamp: 10 } as const;

interface ArrowField { name: string; type: { typeId: number; scale?: number; unit?: number } }
interface ArrowVector { get(i: number): unknown }
export interface ArrowTableLike {
  numRows: number;
  schema: { fields: ArrowField[] };
  getChildAt(i: number): ArrowVector | null;
}

export function kindOfDuckType(type: string): ColKind {
  const t = type.toUpperCase();
  if (/^(TINYINT|SMALLINT|INTEGER|INT|BIGINT|HUGEINT|UTINYINT|USMALLINT|UINTEGER|UBIGINT|FLOAT|DOUBLE|REAL|DECIMAL|NUMERIC)/.test(t)) return "number";
  if (/^(DATE|TIMESTAMP|TIMESTAMPTZ|TIMESTAMP WITH TIME ZONE)/.test(t)) return "date";
  if (t === "BOOLEAN" || t === "BOOL") return "bool";
  if (/^(VARCHAR|TEXT|STRING|CHAR|BPCHAR)/.test(t)) return "text";
  return "other";
}

function kindOfField(f: ArrowField): ColKind {
  switch (f.type.typeId) {
    case T.Int: case T.Float: case T.Decimal: return "number";
    case T.Date: case T.Timestamp: return "date";
    case T.Bool: return "bool";
    case T.Utf8: return "text";
    default: return "other";
  }
}

function decimalToNumber(v: unknown, scale: number): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "bigint") return Number(v) / 10 ** scale;
  const words = v as ArrayLike<number>;
  if (!words || typeof words.length !== "number") return null;
  let big = 0n;
  for (let i = words.length - 1; i >= 0; i--) big = (big << 32n) | BigInt(words[i] >>> 0);
  const bits = BigInt(words.length * 32);
  if (big >> (bits - 1n)) big -= 1n << bits; // two's complement
  return Number(big) / 10 ** scale;
}

export function isoDate(ms: number, withTime: boolean): string {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";
  const iso = d.toISOString();
  return withTime ? iso.slice(0, 19).replace("T", " ") : iso.slice(0, 10);
}

export function convertCell(f: ArrowField, v: unknown): CellValue {
  if (v == null) return null;
  switch (f.type.typeId) {
    case T.Decimal: return decimalToNumber(v, f.type.scale ?? 0);
    case T.Date: return isoDate(Number(v), false);
    case T.Timestamp: {
      // Arrow-JS hands DuckDB timestamps back as epoch milliseconds regardless of the declared unit.
      return isoDate(Number(v), true);
    }
    case T.Int: case T.Float: {
      if (typeof v === "bigint") return Number(v);
      return Number(v);
    }
    case T.Bool: return v ? "true" : "false";
    case T.Utf8: return String(v);
    default: {
      if (typeof v === "bigint") return Number(v);
      if (typeof v === "object") { try { return JSON.stringify(v, (_k, x) => (typeof x === "bigint" ? Number(x) : x)); } catch { return String(v); } }
      return String(v);
    }
  }
}

export function tableToRows(table: ArrowTableLike, maxRows = Infinity): {
  columns: ResultColumn[];
  rows: Record<string, CellValue>[];
} {
  const fields = table.schema.fields;
  const names = fields.map((f, i) => f.name || `column_${i + 1}`);
  const columns: ResultColumn[] = fields.map((f, i) => ({ name: names[i], type: String(f.type), kind: kindOfField(f) }));
  const vecs = fields.map((_, i) => table.getChildAt(i));
  const n = Math.min(table.numRows, maxRows);
  const rows: Record<string, CellValue>[] = new Array(n);
  for (let r = 0; r < n; r++) {
    const row: Record<string, CellValue> = {};
    for (let c = 0; c < fields.length; c++) {
      row[names[c]] = convertCell(fields[c], vecs[c]?.get(r));
    }
    rows[r] = row;
  }
  return { columns, rows };
}
