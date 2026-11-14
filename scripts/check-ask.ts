import { generateDB } from "../src/data/seed";
import { answer, SUGGESTED_PROMPTS, type AskResult } from "../src/data/askEngine";
import { kpis, trendSeries, categoryBreakdown, topVelocity, attention } from "../src/data/selectors";

const db = generateDB();
for (const q of [...SUGGESTED_PROMPTS, "what's the weather"]) {
  const t = performance.now();
  const r = answer(db, q);
  const ms = (performance.now() - t).toFixed(0);
  if (r.intent === "fallback") { console.log(`\n## ${q} -> fallback`); continue; }
  const a = r as AskResult;
  console.log(`\n## ${q}  [${a.intent}] compute ${ms}ms, sim latency ${a.latencyMs}ms, scanned ${a.rowsScanned}`);
  console.log(a.summary.map((s) => (typeof s === "string" ? s : s.b)).join(""));
  console.log(a.rows.slice(0, 4).map((r) => JSON.stringify(r)).join("\n"));
}
for (const range of ["30d", "qtd", "ytd"] as const) {
  const k = kpis(db, range, "all");
  console.log(`\n${range}`, { rev: Math.round(k.revenue), d: k.revenueDelta?.toFixed(1), margin: k.margin.toFixed(1), md: k.marginDelta?.toFixed(1), aov: k.aov.toFixed(2), ad: k.aovDelta?.toFixed(1), ret: k.retention.toFixed(1), rk: k.retentionKind, rd: k.retentionDelta?.toFixed(1) });
  console.log("  trend pts", trendSeries(db, range, "all").length);
}
console.log(kpis(db, "30d", "online").revenue.toFixed(0), kpis(db, "30d", "store").revenue.toFixed(0));
console.log(categoryBreakdown(db, "30d", "all").map((c) => `${c.name} ${c.share.toFixed(1)}%`).join(", "));
console.log(topVelocity(db, "30d", "all").map((p) => `${p.name} ${p.unitsPerWeek.toFixed(0)}/wk cover ${p.coverWeeks.toFixed(1)}w low=${p.low}`).join("\n"));
console.log(attention(db));
