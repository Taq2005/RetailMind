/**
 * Read-only SQL guard. The AI writes SQL, so before it runs in the user's browser we
 * make sure it is exactly one SELECT-style statement. The engine additionally checks
 * that every referenced table is one the user uploaded (see engine.ts).
 */

type Tok = { t: "word" | "str" | "qid" | "punct" | "num"; v: string };

function tokenize(sql: string): Tok[] | null {
  const out: Tok[] = [];
  let i = 0;
  const n = sql.length;
  while (i < n) {
    const c = sql[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === "-" && sql[i + 1] === "-") { while (i < n && sql[i] !== "\n") i++; continue; }
    if (c === "/" && sql[i + 1] === "*") {
      const end = sql.indexOf("*/", i + 2);
      if (end < 0) return null;
      i = end + 2;
      continue;
    }
    if (c === "'") {
      let j = i + 1;
      for (;;) {
        if (j >= n) return null;
        if (sql[j] === "'") { if (sql[j + 1] === "'") { j += 2; continue; } break; }
        j++;
      }
      out.push({ t: "str", v: sql.slice(i + 1, j) });
      i = j + 1;
      continue;
    }
    if (c === '"') {
      let j = i + 1;
      for (;;) {
        if (j >= n) return null;
        if (sql[j] === '"') { if (sql[j + 1] === '"') { j += 2; continue; } break; }
        j++;
      }
      out.push({ t: "qid", v: sql.slice(i + 1, j).replace(/""/g, '"') });
      i = j + 1;
      continue;
    }
    if (c === "$" && /[$A-Za-z_]/.test(sql[i + 1] ?? "")) return null; // dollar quoting / params
    if (/[A-Za-z_]/.test(c)) {
      let j = i + 1;
      while (j < n && /[A-Za-z0-9_$]/.test(sql[j])) j++;
      out.push({ t: "word", v: sql.slice(i, j).toLowerCase() });
      i = j;
      continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i + 1;
      while (j < n && /[0-9._eE]/.test(sql[j])) j++;
      out.push({ t: "num", v: sql.slice(i, j) });
      i = j;
      continue;
    }
    out.push({ t: "punct", v: c });
    i++;
  }
  return out;
}

const FORBIDDEN_WORDS = new Set([
  "insert", "update", "delete", "drop", "create", "alter", "attach", "detach", "copy",
  "pragma", "install", "load", "export", "import", "call", "set", "reset", "execute",
  "truncate", "vacuum", "checkpoint", "grant", "revoke", "begin", "commit", "rollback",
  "use", "prepare", "deallocate", "replace_into", "merge",
]);

/** Table functions that read files, URLs or engine internals. */
const FORBIDDEN_FUNCS = /^(read_|scan_|glob$|parquet_|json_|sniff_csv|duckdb_|pragma_|query$|query_table$|which_secret|http|httpfs|iceberg|delta_|sqlite_|postgres_|mysql_|sql_auto_complete|current_setting|getenv|write_)/;

const FORBIDDEN_NAMES = /^(information_schema|pg_.*|duckdb_.*|sqlite_.*|system|temp|memory)$/;

export interface GuardOk { ok: true; sql: string }
export interface GuardErr { ok: false; reason: string }

export function guardSql(raw: string): GuardOk | GuardErr {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return { ok: false, reason: "Empty query." };
  if (trimmed.length > 8000) return { ok: false, reason: "Query is too long." };
  const toks = tokenize(trimmed);
  if (!toks) return { ok: false, reason: "Could not parse the query (unbalanced quotes or comments)." };

  // Single statement: allow only trailing semicolons.
  let end = toks.length;
  while (end > 0 && toks[end - 1].t === "punct" && toks[end - 1].v === ";") end--;
  const body = toks.slice(0, end);
  if (body.some((t) => t.t === "punct" && t.v === ";")) {
    return { ok: false, reason: "Only one statement is allowed." };
  }
  if (!body.length) return { ok: false, reason: "Empty query." };

  const first = body[0];
  const startsOk = first.t === "word" && ["select", "with", "from"].includes(first.v)
    || (first.t === "punct" && first.v === "(");
  if (!startsOk) return { ok: false, reason: "Only SELECT queries are allowed." };

  for (let i = 0; i < body.length; i++) {
    const tk = body[i];
    if ((tk.t === "qid" || tk.t === "word") && FORBIDDEN_NAMES.test(tk.v.toLowerCase())) {
      return { ok: false, reason: "That table is not available. Only your uploaded data can be queried." };
    }
    if (tk.t !== "word") continue;
    const prev = body[i - 1];
    const afterDot = prev && prev.t === "punct" && prev.v === ".";
    if (afterDot) continue;
    if (FORBIDDEN_WORDS.has(tk.v)) {
      return { ok: false, reason: `"${tk.v.toUpperCase()}" is not allowed. Only read-only SELECT queries can run.` };
    }
    const next = body[i + 1];
    if (next && next.t === "punct" && next.v === "(" && FORBIDDEN_FUNCS.test(tk.v)) {
      return { ok: false, reason: `Function ${tk.v}() is not allowed.` };
    }
  }

  const sql = trimmed.replace(/(\s*;\s*)+$/g, "");
  return { ok: true, sql };
}
