/**
 * Scripted Ask AI engine. Questions are matched to prepared analyses that run against
 * the seed dataset, so every number, table and chart is computed rather than typed in.
 * Anything it can't match gets an honest fallback with the closest suggestions.
 */
import { N_DAYS, TODAY_IDX, dayIndex, dayIso, isCounted, type DB } from "./seed";

export type Seg = string | { b: string };
export type ColFormat = "text" | "usd" | "int" | "pct" | "pts" | "num1" | "num" | "date";
export interface Column {
  key: string;
  label: string;
  format: ColFormat;
  align?: "left" | "right";
}
export type ChartSpec =
  | { kind: "line"; xKey: string; series: { key: string; label: string }[]; data: Record<string, string | number>[]; yFormat: "pct" | "usd" | "num" }
  | { kind: "bar"; xKey: string; series: { key: string; label: string }[]; data: Record<string, string | number>[]; yFormat: "pct" | "usd" | "num" }
  | { kind: "hbar"; labelKey: string; valueKey: string; valueLabel?: string; data: Record<string, string | number>[]; yFormat: "usd" | "num1" | "num"; refLine?: { value: number; label: string } }
  | { kind: "donut"; data: { name: string; value: number }[]; unit?: "usd" | "num"; centerLabel?: string };

export interface AskResult {
  id: string;
  intent: string;
  title: string;
  summary: Seg[];
  /** null when the result shape doesn't suit a chart (uploaded data only). */
  chart: ChartSpec | null;
  sql: string;
  columns: Column[];
  rows: Record<string, string | number>[];
  latencyMs: number;
  rowsScanned: number;
  followUps: string[];
  /** "upload" results come from the user's own files, run in their browser. */
  engine?: "demo" | "upload";
  truncated?: boolean;
  totalRows?: number;
}
export interface Fallback {
  intent: "fallback";
  message: string;
  suggestions: string[];
}

export const SUGGESTED_PROMPTS = [
  "Which products have declining profit margins?",
  "Show regional sales distribution for Q3",
  "Who are our top VIP customers by lifetime value?",
  "Which SKUs will stock out in 14 days?",
  "How are online and in-store sales trending?",
  "Which category drives the most profit?",
];

const usd0 = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const usdK = (n: number) => (n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${Math.round(n / 1000)}K`);
const pts1 = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)} pts`;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Intent {
  id: string;
  test: (q: string) => boolean;
  run: (db: DB) => AskResult;
}

const monthRange = (m: number) => {
  const start = dayIndex(`2026-${String(m + 1).padStart(2, "0")}-01`);
  const end = m === 10 ? N_DAYS - 1 : dayIndex(`2026-${String(m + 2).padStart(2, "0")}-01`) - 1;
  return { start, end };
};

const latencyFor = (scanned: number, base = 18) => Math.round(base + scanned / 5200);

// ------------------------------------------------------------------ 1. declining margins
function decliningMargins(db: DB): AskResult {
  const R0 = N_DAYS - 90;
  const P0 = R0 - 90;
  const nP = db.products.length;
  const rev = [new Float64Array(nP), new Float64Array(nP)];
  const gp = [new Float64Array(nP), new Float64Array(nP)];
  const units = [new Float64Array(nP), new Float64Array(nP)];
  let scanned = 0;
  for (let o = 0; o < db.nOrders; o++) {
    const d = db.o_day[o];
    if (d < P0 || !isCounted(db.o_status[o])) continue;
    const w = d >= R0 ? 0 : 1;
    for (let j = db.o_itemStart[o]; j < db.o_itemStart[o + 1]; j++) {
      const p = db.i_prod[j];
      const line = db.i_qty[j] * db.i_price[j];
      rev[w][p] += line;
      gp[w][p] += (line * db.i_margin[j]) / 100;
      units[w][p] += db.i_qty[j];
      scanned++;
    }
  }
  const rows = db.products
    .map((p, i) => {
      const now = rev[0][i] ? (gp[0][i] / rev[0][i]) * 100 : 0;
      const prior = rev[1][i] ? (gp[1][i] / rev[1][i]) * 100 : 0;
      return { i, product: p.name, category: p.category, prior, now, change: now - prior, revenue: rev[0][i], units0: units[0][i], units1: units[1][i] };
    })
    .filter((r) => r.units0 >= 40 && r.units1 >= 40 && r.change < -1)
    .sort((a, b) => a.change - b.change)
    .slice(0, 8)
    .map((r) => ({ ...r, impact: (-r.change / 100) * r.revenue }));
  const decliners = rows.filter((r) => r.change <= -2);
  const lost = decliners.reduce((s, r) => s + r.impact, 0);

  // monthly margin for the four worst decliners
  const top4 = rows.slice(0, 4);
  const months = [5, 6, 7, 8, 9, 10];
  const data = months.map((m) => {
    const { start, end } = monthRange(m);
    const point: Record<string, string | number> = { month: MONTHS[m] + (m === 10 ? " (to 13th)" : "") };
    top4.forEach((t, k) => {
      let r = 0;
      let g = 0;
      for (let o = 0; o < db.nOrders; o++) {
        const d = db.o_day[o];
        if (d < start || d > end || !isCounted(db.o_status[o])) continue;
        for (let j = db.o_itemStart[o]; j < db.o_itemStart[o + 1]; j++) {
          if (db.i_prod[j] !== t.i) continue;
          const line = db.i_qty[j] * db.i_price[j];
          r += line;
          g += (line * db.i_margin[j]) / 100;
        }
      }
      point[`p${k}`] = r ? Math.round((g / r) * 1000) / 10 : 0;
    });
    return point;
  });
  scanned += months.length * db.nItems * 0.12;

  const worst = rows[0];
  const worstCat = worst ? worst.category : "";
  const sameCat = decliners.filter((r) => r.category === worstCat).length;
  return {
    id: "margins",
    intent: "margins",
    title: "Products with falling gross margin, last 90 days vs the 90 before",
    summary: [
      { b: `${decliners.length} products` },
      ` lost more than 2 points of gross margin in the last 90 days, costing about `,
      { b: usdK(lost) },
      ` in gross profit at current volumes. `,
      { b: worst.product },
      ` fell furthest, from ${worst.prior.toFixed(1)}% to ${worst.now.toFixed(1)}% (`,
      { b: pts1(worst.change) },
      `). ${sameCat > 1 ? `${sameCat} of the decliners are in ${worstCat}, which points to a supplier or freight cost shift rather than a one-off promotion.` : "Costs have crept up on most of these while shelf prices held, so the gap is landing in margin."}`,
    ],
    chart: {
      kind: "line",
      xKey: "month",
      yFormat: "pct",
      series: top4.map((t, k) => ({ key: `p${k}`, label: t.product })),
      data,
    },
    sql: `-- Gross margin by product: last 90 days vs the 90 days before
WITH lines AS (
  SELECT oi.product_id,
         (o.order_date >= DATE '${dayIso(R0)}')                    AS is_recent,
         oi.quantity,
         oi.quantity * oi.unit_price                              AS revenue,
         oi.quantity * oi.unit_price * oi.profit_margin / 100     AS gross_profit
  FROM   order_items oi
  JOIN   orders o ON o.id = oi.order_id
  WHERE  o.status IN ('Completed', 'Processing')
    AND  o.order_date >= DATE '${dayIso(P0)}'
    AND  o.order_date <  DATE '${dayIso(TODAY_IDX)}'
), by_period AS (
  SELECT product_id, is_recent,
         SUM(quantity)                                   AS units,
         SUM(revenue)                                    AS revenue,
         100 * SUM(gross_profit) / NULLIF(SUM(revenue), 0) AS margin_pct
  FROM   lines
  GROUP  BY product_id, is_recent
)
SELECT p.name                                              AS product,
       p.category,
       ROUND(prior.margin_pct, 1)                          AS prior_margin,
       ROUND(recent.margin_pct, 1)                         AS recent_margin,
       ROUND(recent.margin_pct - prior.margin_pct, 1)      AS change_pts,
       ROUND(recent.revenue)                               AS recent_revenue,
       ROUND(-(recent.margin_pct - prior.margin_pct) / 100 * recent.revenue) AS profit_impact
FROM   by_period recent
JOIN   by_period prior ON prior.product_id = recent.product_id AND NOT prior.is_recent
JOIN   products  p     ON p.id = recent.product_id
WHERE  recent.is_recent
  AND  recent.units >= 40 AND prior.units >= 40
  AND  recent.margin_pct - prior.margin_pct < -1
ORDER  BY change_pts ASC
LIMIT  8;`,
    columns: [
      { key: "product", label: "Product", format: "text" },
      { key: "category", label: "Category", format: "text" },
      { key: "prior", label: "Prior 90d", format: "pct", align: "right" },
      { key: "now", label: "Last 90d", format: "pct", align: "right" },
      { key: "change", label: "Change", format: "pts", align: "right" },
      { key: "revenue", label: "Revenue (90d)", format: "usd", align: "right" },
      { key: "impact", label: "Profit impact", format: "usd", align: "right" },
    ],
    rows: rows.map((r) => ({ product: r.product, category: r.category, prior: r.prior, now: r.now, change: r.change, revenue: r.revenue, impact: r.impact })),
    latencyMs: latencyFor(scanned),
    rowsScanned: Math.round(scanned),
    followUps: ["Which SKUs will stock out in 14 days?", "Which category drives the most profit?"],
  };
}

// ------------------------------------------------------------------ 2. regional Q3
function regionalQ3(db: DB): AskResult {
  const q3s = dayIndex("2026-07-01");
  const q3e = dayIndex("2026-10-01") - 1;
  const q2s = dayIndex("2026-04-01");
  const q2e = q3s - 1;
  const regions = ["North America", "EMEA", "APAC", "LATAM"];
  const q3 = regions.map(() => ({ orders: 0, revenue: 0 }));
  const q2 = regions.map(() => ({ orders: 0, revenue: 0 }));
  let scanned = 0;
  for (let o = 0; o < db.nOrders; o++) {
    const d = db.o_day[o];
    if (d < q2s || d > q3e || !isCounted(db.o_status[o])) continue;
    const r = regions.indexOf(db.customers[db.o_cust[o]].region);
    const t = d >= q3s ? q3[r] : q2[r];
    t.orders++;
    t.revenue += db.o_total[o];
    scanned++;
  }
  const total = q3.reduce((s, r) => s + r.revenue, 0);
  const rows = regions
    .map((name, i) => ({
      region: name,
      orders: q3[i].orders,
      revenue: q3[i].revenue,
      share: (q3[i].revenue / total) * 100,
      aov: q3[i].revenue / q3[i].orders,
      qoq: (q3[i].revenue / q2[i].revenue - 1) * 100,
    }))
    .sort((a, b) => b.revenue - a.revenue);
  const fastest = [...rows].sort((a, b) => b.qoq - a.qoq)[0];
  const richest = [...rows].sort((a, b) => b.aov - a.aov)[0];
  const lead = rows[0];
  return {
    id: "regional",
    intent: "regional",
    title: "Q3 2026 revenue by customer region",
    summary: [
      `${lead.region} led Q3 with `,
      { b: usdK(lead.revenue) },
      `, ${lead.share.toFixed(1)}% of the quarter's `,
      { b: usdK(total) },
      `. `,
      fastest.region === lead.region
        ? `It also grew fastest, at `
        : `${fastest.region} grew fastest, at `,
      { b: `${fastest.qoq > 0 ? "+" : ""}${fastest.qoq.toFixed(1)}%` },
      ` quarter over quarter. `,
      `${richest.region} has the highest average order value at ${usd0(richest.aov)}${richest.region === lead.region ? "" : `, against ${usd0(lead.aov)} in ${lead.region}`}.`,
    ],
    chart: { kind: "donut", data: rows.map((r) => ({ name: r.region, value: Math.round(r.revenue) })) },
    sql: `-- Q3 2026 revenue by customer region, with quarter-over-quarter change
WITH q AS (
  SELECT c.region,
         CASE WHEN o.order_date >= DATE '${dayIso(q3s)}' THEN 'q3' ELSE 'q2' END AS quarter,
         COUNT(*)            AS orders,
         SUM(o.total_amount) AS revenue
  FROM   orders o
  JOIN   customers c ON c.id = o.customer_id
  WHERE  o.status IN ('Completed', 'Processing')
    AND  o.order_date >= DATE '${dayIso(q2s)}'
    AND  o.order_date <  DATE '${dayIso(q3e + 1)}'
  GROUP  BY c.region, quarter
)
SELECT q3.region,
       q3.orders,
       ROUND(q3.revenue)                                        AS revenue,
       ROUND(100 * q3.revenue / SUM(q3.revenue) OVER (), 1)     AS share_pct,
       ROUND(q3.revenue / q3.orders, 2)                         AS aov,
       ROUND(100 * (q3.revenue / q2.revenue - 1), 1)            AS qoq_pct
FROM   q q3
JOIN   q q2 ON q2.region = q3.region AND q2.quarter = 'q2'
WHERE  q3.quarter = 'q3'
ORDER  BY q3.revenue DESC;`,
    columns: [
      { key: "region", label: "Region", format: "text" },
      { key: "orders", label: "Orders", format: "int", align: "right" },
      { key: "revenue", label: "Revenue", format: "usd", align: "right" },
      { key: "share", label: "Share", format: "pct", align: "right" },
      { key: "aov", label: "AOV", format: "usd", align: "right" },
      { key: "qoq", label: "vs Q2", format: "pct", align: "right" },
    ],
    rows,
    latencyMs: latencyFor(scanned, 14),
    rowsScanned: scanned,
    followUps: ["How are online and in-store sales trending?", "Who are our top VIP customers by lifetime value?"],
  };
}

// ------------------------------------------------------------------ 3. VIP lifetime value
function topVip(db: DB): AskResult {
  const n = db.customers.length;
  const spend = new Float64Array(n);
  const count = new Int32Array(n);
  const last = new Int16Array(n).fill(-1);
  let scanned = 0;
  let allRev = 0;
  for (let o = 0; o < db.nOrders; o++) {
    if (!isCounted(db.o_status[o])) continue;
    const c = db.o_cust[o];
    allRev += db.o_total[o];
    scanned++;
    if (db.customers[c].segment !== "VIP") continue;
    spend[c] += db.o_total[o];
    count[c]++;
    if (db.o_day[o] > last[c]) last[c] = db.o_day[o];
  }
  const vipIdx: number[] = [];
  let vipRev = 0;
  for (let c = 0; c < n; c++) if (db.customers[c].segment === "VIP") {
    vipIdx.push(c);
    vipRev += spend[c];
  }
  vipIdx.sort((a, b) => spend[b] - spend[a]);
  const top = vipIdx.slice(0, 10);
  const topRev = top.reduce((s, c) => s + spend[c], 0);
  const rows = top.map((c) => ({
    customer: db.customers[c].name,
    region: db.customers[c].region,
    orders: count[c],
    ltv: spend[c],
    aov: spend[c] / count[c],
    last: dayIso(last[c]),
  }));
  return {
    id: "vip",
    intent: "vip",
    title: "Top 10 VIP customers by lifetime value",
    summary: [
      `Your `,
      { b: `${vipIdx.length} VIP customers` },
      ` generated `,
      { b: `${((vipRev / allRev) * 100).toFixed(1)}%` },
      ` of revenue across the 12 months of history connected. The top ten alone are worth `,
      { b: usdK(topRev) },
      `, led by ${rows[0].customer} at `,
      { b: usd0(rows[0].ltv) },
      ` over ${rows[0].orders} orders. Lifetime here means every order in the connected history.`,
    ],
    chart: { kind: "hbar", labelKey: "customer", valueKey: "ltv", yFormat: "usd", data: rows.map((r) => ({ customer: r.customer, ltv: Math.round(r.ltv) })) },
    sql: `-- Top 10 VIP customers by lifetime value (all connected history)
SELECT c.name                                AS customer,
       c.region,
       COUNT(o.id)                           AS orders,
       ROUND(SUM(o.total_amount))            AS lifetime_value,
       ROUND(AVG(o.total_amount), 2)         AS aov,
       MAX(o.order_date)::date               AS last_order
FROM   customers c
JOIN   orders o ON o.customer_id = c.id
WHERE  c.segment = 'VIP'
  AND  o.status IN ('Completed', 'Processing')
GROUP  BY c.id, c.name, c.region
ORDER  BY lifetime_value DESC
LIMIT  10;`,
    columns: [
      { key: "customer", label: "Customer", format: "text" },
      { key: "region", label: "Region", format: "text" },
      { key: "orders", label: "Orders", format: "int", align: "right" },
      { key: "ltv", label: "Lifetime value", format: "usd", align: "right" },
      { key: "aov", label: "AOV", format: "usd", align: "right" },
      { key: "last", label: "Last order", format: "date", align: "right" },
    ],
    rows,
    latencyMs: latencyFor(scanned, 21),
    rowsScanned: scanned,
    followUps: ["Show regional sales distribution for Q3", "Which category drives the most profit?"],
  };
}

// ------------------------------------------------------------------ 4. stock-outs
function stockOuts(db: DB): AskResult {
  const from = N_DAYS - 28;
  const units = new Float64Array(db.products.length);
  let scanned = 0;
  for (let o = 0; o < db.nOrders; o++) {
    if (db.o_day[o] < from || !isCounted(db.o_status[o])) continue;
    for (let j = db.o_itemStart[o]; j < db.o_itemStart[o + 1]; j++) {
      units[db.i_prod[j]] += db.i_qty[j];
      scanned++;
    }
  }
  const rows = db.products
    .map((p, i) => {
      const perDay = units[i] / 28;
      const cover = perDay ? p.stock_quantity / perDay : 999;
      return {
        product: p.name,
        stock: p.stock_quantity,
        perDay,
        cover,
        stockout: dayIso(TODAY_IDX + Math.round(cover)),
        reorder: p.reorder_level,
        atRisk: Math.max(0, 14 - cover) * perDay * p.retail_price,
      };
    })
    .filter((r) => r.cover < 14)
    .sort((a, b) => a.cover - b.cover);
  const exposure = rows.reduce((s, r) => s + r.atRisk, 0);
  const first = rows[0];
  return {
    id: "stock",
    intent: "stock",
    title: "SKUs projected to run out within 14 days",
    summary: rows.length
      ? [
          { b: `${rows.length} SKUs` },
          ` will run out inside two weeks at the last 28 days' sales pace, putting roughly `,
          { b: usd0(exposure) },
          ` of sales at risk. `,
          { b: first.product },
          ` is closest, with only `,
          { b: `${first.cover.toFixed(1)} days` },
          ` of cover (${first.stock} units, selling ${first.perDay.toFixed(1)} a day).`,
        ]
      : ["No SKU is projected to run out in the next 14 days at the current sales pace."],
    chart: { kind: "hbar", labelKey: "product", valueKey: "cover", yFormat: "num1", refLine: { value: 14, label: "14-day horizon" }, data: rows.map((r) => ({ product: r.product, cover: Math.round(r.cover * 10) / 10 })) },
    sql: `-- SKUs that will stock out within 14 days at the last 28 days' sales pace
WITH velocity AS (
  SELECT oi.product_id,
         SUM(oi.quantity) / 28.0 AS units_per_day
  FROM   order_items oi
  JOIN   orders o ON o.id = oi.order_id
  WHERE  o.status IN ('Completed', 'Processing')
    AND  o.order_date >= DATE '${dayIso(from)}'
    AND  o.order_date <  DATE '${dayIso(TODAY_IDX)}'
  GROUP  BY oi.product_id
)
SELECT p.name                                              AS product,
       p.stock_quantity                                    AS on_hand,
       ROUND(v.units_per_day, 1)                           AS units_per_day,
       ROUND(p.stock_quantity / v.units_per_day, 1)        AS days_of_cover,
       CURRENT_DATE + (p.stock_quantity / v.units_per_day)::int AS stockout_date,
       p.reorder_level
FROM   products p
JOIN   velocity v ON v.product_id = p.id
WHERE  p.stock_quantity / v.units_per_day < 14
ORDER  BY days_of_cover;`,
    columns: [
      { key: "product", label: "Product", format: "text" },
      { key: "stock", label: "On hand", format: "int", align: "right" },
      { key: "perDay", label: "Units / day", format: "num1", align: "right" },
      { key: "cover", label: "Days of cover", format: "num1", align: "right" },
      { key: "stockout", label: "Runs out", format: "date", align: "right" },
      { key: "reorder", label: "Reorder at", format: "int", align: "right" },
      { key: "atRisk", label: "Sales at risk", format: "usd", align: "right" },
    ],
    rows,
    latencyMs: latencyFor(scanned, 16),
    rowsScanned: scanned,
    followUps: ["Which products have declining profit margins?", "How are online and in-store sales trending?"],
  };
}

// ------------------------------------------------------------------ 5. channel trend
function channelTrend(db: DB): AskResult {
  const months = [5, 6, 7, 8, 9, 10];
  let scanned = 0;
  const rows = months.map((m) => {
    const { start, end } = monthRange(m);
    let on = 0;
    let off = 0;
    for (let o = 0; o < db.nOrders; o++) {
      const d = db.o_day[o];
      if (d < start || d > end || !isCounted(db.o_status[o])) continue;
      if (db.o_ch[o] === 0) on += db.o_total[o];
      else off += db.o_total[o];
      scanned++;
    }
    return { month: MONTHS[m] + (m === 10 ? " (to 13th)" : ""), online: on, instore: off, total: on + off, share: (on / (on + off)) * 100 };
  });
  const a = rows[0];
  const b = rows[rows.length - 2]; // last full month
  return {
    id: "channels",
    intent: "channels",
    title: "Online vs in-store revenue, last 6 months",
    summary: [
      `Online made up `,
      { b: `${b.share.toFixed(1)}%` },
      ` of ${b.month} revenue, ${b.share >= a.share ? "up" : "down"} from ${a.share.toFixed(1)}% in ${a.month}. In-store brought in `,
      { b: usdK(b.instore) },
      ` in ${b.month}; online brought in `,
      { b: usdK(b.online) },
      `. November is partial (to the 13th) and already ${usdK(rows[rows.length - 1].total)}, with promotions skewing the mix online.`,
    ],
    chart: {
      kind: "bar",
      xKey: "month",
      yFormat: "usd",
      series: [
        { key: "online", label: "Online" },
        { key: "instore", label: "In-store" },
      ],
      data: rows.map((r) => ({ month: r.month, online: Math.round(r.online), instore: Math.round(r.instore) })),
    },
    sql: `-- Monthly revenue by channel, last 6 months
SELECT date_trunc('month', order_date)::date                          AS month,
       SUM(total_amount) FILTER (WHERE channel = 'Online')            AS online_revenue,
       SUM(total_amount) FILTER (WHERE channel = 'In-Store')          AS instore_revenue,
       SUM(total_amount)                                              AS total_revenue,
       ROUND(100 * SUM(total_amount) FILTER (WHERE channel = 'Online')
                 / SUM(total_amount), 1)                              AS online_share_pct
FROM   orders
WHERE  status IN ('Completed', 'Processing')
  AND  order_date >= DATE '2026-06-01'
  AND  order_date <  DATE '${dayIso(TODAY_IDX)}'
GROUP  BY 1
ORDER  BY 1;`,
    columns: [
      { key: "month", label: "Month", format: "text" },
      { key: "online", label: "Online", format: "usd", align: "right" },
      { key: "instore", label: "In-store", format: "usd", align: "right" },
      { key: "total", label: "Total", format: "usd", align: "right" },
      { key: "share", label: "Online share", format: "pct", align: "right" },
    ],
    rows,
    latencyMs: latencyFor(scanned, 12),
    rowsScanned: scanned,
    followUps: ["Show regional sales distribution for Q3", "Which category drives the most profit?"],
  };
}

// ------------------------------------------------------------------ 6. category profit
function categoryProfit(db: DB): AskResult {
  const w0 = N_DAYS - 30;
  const rev = new Map<string, number>();
  const cogs = new Map<string, number>();
  let scanned = 0;
  for (let o = 0; o < db.nOrders; o++) {
    if (db.o_day[o] < w0 || !isCounted(db.o_status[o])) continue;
    const ratio = db.o_gross[o] ? db.o_total[o] / db.o_gross[o] : 1;
    for (let j = db.o_itemStart[o]; j < db.o_itemStart[o + 1]; j++) {
      const cat = db.catOf[db.i_prod[j]];
      const line = db.i_qty[j] * db.i_price[j];
      rev.set(cat, (rev.get(cat) ?? 0) + line * ratio);
      cogs.set(cat, (cogs.get(cat) ?? 0) + line * (1 - db.i_margin[j] / 100));
      scanned++;
    }
  }
  const rows = [...rev.keys()]
    .map((cat) => {
      const r = rev.get(cat)!;
      const p = r - cogs.get(cat)!;
      return { category: cat, revenue: r, profit: p, margin: (p / r) * 100 };
    })
    .sort((a, b) => b.profit - a.profit);
  const totalProfit = rows.reduce((s, r) => s + r.profit, 0);
  const totalRev = rows.reduce((s, r) => s + r.revenue, 0);
  const lead = rows[0];
  const best = [...rows].sort((a, b) => b.margin - a.margin)[0];
  return {
    id: "category",
    intent: "category",
    title: "Profit by category, last 30 days",
    summary: [
      { b: lead.category },
      ` contributes `,
      { b: `${((lead.profit / totalProfit) * 100).toFixed(1)}%` },
      ` of profit on ${((lead.revenue / totalRev) * 100).toFixed(1)}% of revenue (${usdK(lead.profit)} at a ${lead.margin.toFixed(1)}% margin). `,
      { b: best.category },
      ` has the richest margin at ${best.margin.toFixed(1)}%, while `,
      { b: rows[rows.length - 1].category },
      ` earns the least at ${rows[rows.length - 1].margin.toFixed(1)}%.`,
    ],
    chart: { kind: "bar", xKey: "category", yFormat: "usd", series: [{ key: "profit", label: "Net profit" }], data: rows.map((r) => ({ category: r.category, profit: Math.round(r.profit) })) },
    sql: `-- Net profit by category, last 30 days (order discounts allocated pro rata)
WITH lines AS (
  SELECT p.category,
         oi.quantity * oi.unit_price
           * o.total_amount / NULLIF(o.total_amount + o.discount_amount, 0) AS net_revenue,
         oi.quantity * oi.unit_price * (1 - oi.profit_margin / 100)         AS cogs
  FROM   order_items oi
  JOIN   orders   o ON o.id = oi.order_id
  JOIN   products p ON p.id = oi.product_id
  WHERE  o.status IN ('Completed', 'Processing')
    AND  o.order_date >= DATE '${dayIso(w0)}'
    AND  o.order_date <  DATE '${dayIso(TODAY_IDX)}'
)
SELECT category,
       ROUND(SUM(net_revenue))                                   AS revenue,
       ROUND(SUM(net_revenue - cogs))                            AS profit,
       ROUND(100 * SUM(net_revenue - cogs) / SUM(net_revenue), 1) AS margin_pct
FROM   lines
GROUP  BY category
ORDER  BY profit DESC;`,
    columns: [
      { key: "category", label: "Category", format: "text" },
      { key: "revenue", label: "Revenue", format: "usd", align: "right" },
      { key: "profit", label: "Net profit", format: "usd", align: "right" },
      { key: "margin", label: "Margin", format: "pct", align: "right" },
    ],
    rows,
    latencyMs: latencyFor(scanned, 15),
    rowsScanned: scanned,
    followUps: ["Which products have declining profit margins?", "Show regional sales distribution for Q3"],
  };
}

// ------------------------------------------------------------------ router
const INTENTS: Intent[] = [
  { id: "margins", test: (q) => /margin/.test(q) || /(declin|eroding|shrink).*(profit|product)/.test(q), run: decliningMargins },
  { id: "regional", test: (q) => /region|geograph|country|countries|emea|apac|latam|north america/.test(q), run: regionalQ3 },
  { id: "vip", test: (q) => /\bvip\b|lifetime|\bltv\b|top customers|best customers|loyal/.test(q), run: topVip },
  { id: "stock", test: (q) => /stock|inventory|sell out|run out|reorder|out of/.test(q), run: stockOuts },
  { id: "channels", test: (q) => /online|in-?store|channel|omni/.test(q), run: channelTrend },
  { id: "category", test: (q) => /categor|most profit|profitable|profit/.test(q), run: categoryProfit },
];

export function answer(db: DB, question: string): AskResult | Fallback {
  const q = question.toLowerCase();
  const hit = INTENTS.find((i) => i.test(q));
  if (!hit) {
    return {
      intent: "fallback",
      message:
        "I can't map that question to your connected data yet. I only run read-only queries against tables I can see: customers, products, orders, order_items. Try one of these, or rephrase with a metric, a time range and a dimension (for example, revenue by region last quarter).",
      suggestions: SUGGESTED_PROMPTS.slice(0, 4),
    };
  }
  return hit.run(db);
}

/** Render a cell for the table and for CSV export. */
export function formatCell(v: string | number, f: ColFormat): string {
  if (typeof v === "string") {
    if (f === "date" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(v + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
    return v;
  }
  if (f === "num") return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
  switch (f) {
    case "usd":
      return usd0(v);
    case "int":
      return Math.round(v).toLocaleString("en-US");
    case "pct":
      return `${v.toFixed(1)}%`;
    case "pts":
      return pts1(v);
    case "num1":
      return v.toFixed(1);
    default:
      return String(v);
  }
}

export function toCsv(result: AskResult): string {
  // Strings starting with = + - @ are prefixed so spreadsheet apps never run them as formulas.
  const esc = (s: string) => {
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const head = result.columns.map((c) => esc(c.label)).join(",");
  const body = result.rows.map((r) => result.columns.map((c) => {
    const v = r[c.key];
    return typeof v === "number" ? (c.format === "pct" || c.format === "pts" || c.format === "num1" ? v.toFixed(2) : String(Math.round(v * 100) / 100)) : esc(String(v ?? ""));
  }).join(","));
  return [head, ...body].join("\n");
}
