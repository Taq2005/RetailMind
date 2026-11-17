import { tableToRows } from "./arrowConvert";
import type { DuckLike } from "./duckTypes";
import { qi } from "./names";
import type { TableInfo } from "./types";

/** Fills in examples and per-column statistics. Safe to call on any table. */
export async function profileTable(db: DuckLike, t: TableInfo): Promise<void> {
  const tbl = qi(t.name);
  const stats: string[] = [];
  t.columns.forEach((c, i) => {
    const q = qi(c.name);
    stats.push(
      `count(*) - count(${q}) AS nulls${i}`,
      `count(DISTINCT ${q}) AS dist${i}`,
      `CAST(min(${q}) AS VARCHAR) AS mn${i}`,
      `CAST(max(${q}) AS VARCHAR) AS mx${i}`,
    );
  });
  const s = tableToRows(await db.query(`SELECT ${stats.join(", ")} FROM ${tbl}`)).rows[0] ?? {};

  for (let i = 0; i < t.columns.length; i++) {
    const c = t.columns[i];
    const q = qi(c.name);
    const distinct = Number(s[`dist${i}`] ?? 0);
    const top: { value: string; count: number }[] = [];
    let examples: string[] = [];
    if (c.kind === "text" || c.kind === "bool") {
      const r = tableToRows(
        await db.query(
          `SELECT CAST(${q} AS VARCHAR) AS v, count(*) AS n FROM ${tbl} WHERE ${q} IS NOT NULL GROUP BY 1 ORDER BY n DESC, v LIMIT 8`,
        ),
      ).rows;
      examples = r.slice(0, 5).map((x) => String(x.v).slice(0, 60));
      if (distinct <= 50) r.slice(0, 5).forEach((x) => top.push({ value: String(x.v).slice(0, 60), count: Number(x.n) }));
    } else {
      const mn = s[`mn${i}`];
      const mx = s[`mx${i}`];
      examples = [mn, mx].filter((v): v is string => typeof v === "string");
      if (c.kind === "number") {
        const r = tableToRows(await db.query(`SELECT CAST(${q} AS VARCHAR) AS v FROM ${tbl} WHERE ${q} IS NOT NULL LIMIT 3`)).rows;
        examples = [...new Set([...r.map((x) => String(x.v)), ...examples])].slice(0, 4);
      }
    }
    c.examples = examples;
    c.profile = {
      nulls: Number(s[`nulls${i}`] ?? 0),
      distinct,
      min: (s[`mn${i}`] as string | null) ?? null,
      max: (s[`mx${i}`] as string | null) ?? null,
      top,
    };
  }
}
