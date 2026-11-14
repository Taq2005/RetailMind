import { Fragment } from "react";

const KEYWORDS = new Set(
  "SELECT FROM WHERE JOIN LEFT RIGHT INNER OUTER ON AS WITH GROUP BY ORDER LIMIT OFFSET HAVING AND OR NOT IN IS NULL CASE WHEN THEN ELSE END DISTINCT FILTER OVER PARTITION ASC DESC UNION ALL BETWEEN LIKE DATE INTERVAL CURRENT_DATE TRUE FALSE".split(" ")
);
const FUNCTIONS = new Set("SUM COUNT AVG MIN MAX ROUND NULLIF COALESCE DATE_TRUNC DATE_PART CAST EXTRACT LOWER UPPER".split(" "));

type Tok = { t: "comment" | "string" | "number" | "keyword" | "func" | "ident" | "punct" | "space"; v: string };

function tokenize(sql: string): Tok[] {
  const out: Tok[] = [];
  const re = /(--[^\n]*)|('(?:[^']|'')*')|(\d+(?:\.\d+)?)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|(::|[^\sA-Za-z0-9_])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql))) {
    if (m[1]) out.push({ t: "comment", v: m[1] });
    else if (m[2]) out.push({ t: "string", v: m[2] });
    else if (m[3]) out.push({ t: "number", v: m[3] });
    else if (m[4]) {
      const up = m[4].toUpperCase();
      const next = sql[re.lastIndex];
      out.push({ t: KEYWORDS.has(up) ? "keyword" : FUNCTIONS.has(up) && next === "(" ? "func" : "ident", v: m[4] });
    } else if (m[5]) out.push({ t: "space", v: m[5] });
    else out.push({ t: "punct", v: m[6] });
  }
  return out;
}

const COLORS: Record<Tok["t"], string> = {
  comment: "text-slate-500 italic",
  string: "text-emerald-300",
  number: "text-amber-300",
  keyword: "text-indigo-300 font-medium",
  func: "text-sky-300",
  ident: "text-slate-100",
  punct: "text-slate-400",
  space: "",
};

export function SqlHighlight({ sql }: { sql: string }) {
  const lines = sql.split("\n");
  return (
    <pre className="overflow-x-auto py-3 font-mono text-[12px] leading-[1.7] scrollbar-thin" aria-label="SQL query">
      <code>
        {lines.map((line, i) => (
          <div key={i} className="flex px-4 hover:bg-white/[0.04]">
            <span className="num mr-4 w-5 shrink-0 select-none text-right text-slate-600">{i + 1}</span>
            <span className="whitespace-pre">
              {line === "" ? " " : tokenize(line).map((tk, k) => (
                <Fragment key={k}>
                  <span className={COLORS[tk.t]}>{tk.v}</span>
                </Fragment>
              ))}
            </span>
          </div>
        ))}
      </code>
    </pre>
  );
}
