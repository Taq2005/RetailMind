import { generateDB, TARGETS, W_START, W_END, P_START, P_END, isCounted, dayIso } from "../src/data/seed";

const t0 = performance.now();
const db = generateDB();
const ms = performance.now() - t0;
console.log(`generated in ${ms.toFixed(0)}ms: ${db.nOrders} orders, ${db.nItems} items, ${db.customers.length} customers, ${db.products.length} products`);
console.log("calibration", db.calibration);

function win(a: number, b: number) {
  let rev = 0, cogs = 0, n = 0;
  const custs = new Set<number>();
  for (let o = 0; o < db.nOrders; o++) {
    const d = db.o_day[o];
    if (d < a || d > b || !isCounted(db.o_status[o])) continue;
    rev += db.o_total[o]; n++; custs.add(db.o_cust[o]);
    for (let j = db.o_itemStart[o]; j < db.o_itemStart[o + 1]; j++) cogs += db.i_qty[j] * db.i_price[j] * (1 - db.i_margin[j] / 100);
  }
  return { rev, n, margin: (rev - cogs) / rev, aov: rev / n, custs };
}
const W = win(W_START, W_END), P = win(P_START, P_END);
let kept = 0;
for (const c of P.custs) if (W.custs.has(c)) kept++;
console.log("W30", { rev: W.rev.toFixed(0), n: W.n, aov: W.aov.toFixed(2), margin: (W.margin * 100).toFixed(2), uniq: W.custs.size });
console.log("P30", { rev: P.rev.toFixed(0), n: P.n, aov: P.aov.toFixed(2), margin: (P.margin * 100).toFixed(2), uniq: P.custs.size });
console.log("MoM", ((W.rev / P.rev - 1) * 100).toFixed(2) + "%", "retention", ((kept / P.custs.size) * 100).toFixed(2) + "%");
const all = win(0, 364);
console.log("year", { rev: all.rev.toFixed(0), n: all.n, target: TARGETS.arr, aov: all.aov.toFixed(2) });

// monthly revenue shape
const byMonth = new Map<string, number>();
for (let o = 0; o < db.nOrders; o++) if (isCounted(db.o_status[o])) { const k = dayIso(db.o_day[o]).slice(0, 7); byMonth.set(k, (byMonth.get(k) ?? 0) + db.o_total[o]); }
console.log([...byMonth.entries()].sort().map(([k, v]) => `${k} ${(v / 1000).toFixed(0)}k`).join("  "));

const seg: Record<string, number> = {};
for (const c of db.customers) seg[c.segment] = (seg[c.segment] ?? 0) + 1;
console.log("segments", seg);
const low = db.products.filter((p) => p.stock_quantity < p.reorder_level);
console.log("below reorder:", low.length, low.map((p) => p.name).join(", "));
