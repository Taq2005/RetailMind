import { tableToRows } from "./arrowConvert";
import type { DuckLike } from "./duckTypes";
import { guardSql } from "./sqlGuard";
import type { QueryResult, SchemaPayload, TableInfo } from "./types";

export const RESULT_ROW_LIMIT = 1000;

export class SqlRejected extends Error {}

/** Validate then run an AI-written query against the user's own tables only. */
export async function runUserQuery(db: DuckLike, rawSql: string, tables: TableInfo[]): Promise<{ sql: string; result: QueryResult }> {
  const g = guardSql(rawSql);
  if (!g.ok) throw new SqlRejected(g.reason);

  const allowed = new Set(tables.map((t) => t.name.toLowerCase()));
  let referenced: string[];
  try {
    referenced = await db.tableNames(g.sql);
  } catch (e) {
    throw new Error(cleanErr(e));
  }
  for (const name of referenced) {
    if (!allowed.has(name.toLowerCase())) {
      throw new SqlRejected(`Table "${name}" does not exist in your data.`);
    }
  }

  const t0 = performance.now();
  const wrapped = `SELECT * FROM (${g.sql}) AS _q LIMIT ${RESULT_ROW_LIMIT + 1}`;
  let table;
  try {
    table = await db.query(wrapped);
  } catch (e) {
    throw new Error(cleanErr(e));
  }
  const truncated = table.numRows > RESULT_ROW_LIMIT;
  const { columns, rows } = tableToRows(table, RESULT_ROW_LIMIT);
  return { sql: g.sql, result: { columns, rows, truncated, ms: Math.max(1, Math.round(performance.now() - t0)) } };
}

export function cleanErr(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  return m.replace(/\s+/g, " ").replace(/^(Binder|Catalog|Parser|Conversion|Invalid Input|Out of Range) Error:\s*/i, "").slice(0, 300);
}

export function buildSchemaPayload(tables: TableInfo[]): SchemaPayload {
  return {
    tables: tables.map((t) => ({
      name: t.name,
      rowCount: t.rowCount,
      columns: t.columns.map((c) => ({ name: c.name, type: c.type, examples: c.examples.slice(0, 5) })),
    })),
  };
}
