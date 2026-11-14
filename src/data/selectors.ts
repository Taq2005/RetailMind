import type { ChannelFilter, RangeKey } from "./types";
import { N_DAYS, TODAY_IDX, dayIndex, dayIso, isCounted, type DB } from "./seed";

export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "30d", label: "Last 30 days" },
  { key: "qtd", label: "QTD" },
  { key: "ytd", label: "YTD" },
];
export const CHANNEL_OPTIONS: { key: ChannelFilter; label: string }[] = [
  { key: "all", label: "All channels" },
  { key: "online", label: "Online" },
  { key: "store", label: "In-store" },
];

export interface Win {
  start: number;
  end: number;
}

/** k = 0 is the current window, k = 1 the equal-length window before it, and so on. */
export function windowFor(range: RangeKey, k = 0): Win | null {
  const end0 = N_DAYS - 1;
  if (range === "30d") {
    const start = end0 - 29 - 30 * k;
    return start < 0 ? null : { start, end: start + 29 };
  }
  if (range === "qtd") {
    const q0 = dayIndex("2026-10-01");
    const len = end0 - q0 + 1;
    if (k === 0) return { start: q0, end: end0 };
    // previous quarter: same number of elapsed days from its start (Jul 1), then earlier blocks of equal length
    const start = dayIndex("2026-07-01") - len * (k - 1);
    return start < 0 ? null : { start, end: start + len - 1 };
  }
  if (k > 0) return null;
  return { start: dayIndex("2026-01-01"), end: end0 };
}

export const windowLabel = (w: Win) => {
  const f = (d: number) => new Date(dayIso(d) + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${f(w.start)} to ${f(w.end)}`;
};

// ---------------------------------------------------------------- aggregates
interface Agg {
  rev: Float64Array[]; // [channel][day]
  cogs: Float64Array[];
  ord: Float64Array[];
}
const aggCache = new WeakMap<DB, Agg>();

function aggregates(db: DB): Agg {
  const hit = aggCache.get(db);
  if (hit) return hit;
  const rev = [new Float64Array(N_DAYS), new Float64Array(N_DAYS)];
  const cogs = [new Float64Array(N_DAYS), new Float64Array(N_DAYS)];
  const ord = [new Float64Array(N_DAYS), new Float64Array(N_DAYS)];
  for (let o = 0; o < db.nOrders; o++) {
    if (!isCounted(db.o_status[o])) continue;
    const d = db.o_day[o];
    const ch = db.o_ch[o];
    rev[ch][d] += db.o_total[o];
    ord[ch][d] += 1;
    let c = 0;
    for (let j = db.o_itemStart[o]; j < db.o_itemStart[o + 1]; j++) c += db.i_qty[j] * db.i_price[j] * (1 - db.i_margin[j] / 100);
    cogs[ch][d] += c;
  }
  const out = { rev, cogs, ord };
  aggCache.set(db, out);
  return out;
}

const chans = (f: ChannelFilter) => (f === "all" ? [0, 1] : f === "online" ? [0] : [1]);
const sumRange = (arrs: Float64Array[], f: ChannelFilter, w: Win) => {
  let s = 0;
  for (const c of chans(f)) for (let d = w.start; d <= w.end; d++) s += arrs[c][d];
  return s;
};

// ---------------------------------------------------------------- KPIs
function customerSet(db: DB, w: Win, f: ChannelFilter) {
  const allowed = chans(f);
  const set = new Map<number, number>();
  for (let o = 0; o < db.nOrders; o++) {
    const d = db.o_day[o];
    if (d < w.start || d > w.end) continue;
    if (!isCounted(db.o_status[o]) || !allowed.includes(db.o_ch[o])) continue;
    const c = db.o_cust[o];
    set.set(c, (set.get(c) ?? 0) + 1);
  }
  return set;
}

function retention(db: DB, range: RangeKey, f: ChannelFilter, k: number): { value: number; kind: "retention" | "repeat" } | null {
  const cur = windowFor(range, k);
  if (!cur) return null;
  const prev = windowFor(range, k + 1);
  if (!prev) {
    // YTD: of the customers who bought in H1, how many bought again from July on
    const h1 = { start: cur.start, end: dayIndex("2026-07-01") - 1 };
    const h2 = { start: dayIndex("2026-07-01"), end: cur.end };
    const A = customerSet(db, h1, f);
    const B = customerSet(db, h2, f);
    if (A.size === 0) return null;
    let kept = 0;
    for (const c of A.keys()) if (B.has(c)) kept++;
    return { value: (kept / A.size) * 100, kind: "repeat" };
  }
  const B = customerSet(db, cur, f);
  const A = customerSet(db, prev, f);
  if (A.size === 0) return null;
  let kept = 0;
  for (const c of A.keys()) if (B.has(c)) kept++;
  return { value: (kept / A.size) * 100, kind: "retention" };
}

export interface Kpis {
  revenue: number;
  revenueDelta: number | null;
  profit: number;
  margin: number;
  marginDelta: number | null;
  aov: number;
  aovDelta: number | null;
  retention: number;
  retentionKind: "retention" | "repeat";
  retentionDelta: number | null;
  orders: number;
  window: Win;
  compareLabel: string;
}

const kpiCache = new Map<string, Kpis>();
export function kpis(db: DB, range: RangeKey, f: ChannelFilter): Kpis {
  const key = `${range}|${f}`;
  const hit = kpiCache.get(key);
  if (hit) return hit;
  const a = aggregates(db);
  const w = windowFor(range, 0)!;
  const p = windowFor(range, 1);
  const rev = sumRange(a.rev, f, w);
  const cogs = sumRange(a.cogs, f, w);
  const ord = sumRange(a.ord, f, w);
  const prevRev = p ? sumRange(a.rev, f, p) : 0;
  const prevCogs = p ? sumRange(a.cogs, f, p) : 0;
  const prevOrd = p ? sumRange(a.ord, f, p) : 0;
  const ret = retention(db, range, f, 0)!;
  const retPrev = p ? retention(db, range, f, 1) : null;
  const margin = rev ? ((rev - cogs) / rev) * 100 : 0;
  const prevMargin = prevRev ? ((prevRev - prevCogs) / prevRev) * 100 : 0;
  const aov = ord ? rev / ord : 0;
  const prevAov = prevOrd ? prevRev / prevOrd : 0;
  const out: Kpis = {
    revenue: rev,
    revenueDelta: p && prevRev ? (rev / prevRev - 1) * 100 : null,
    profit: rev - cogs,
    margin,
    marginDelta: p && prevRev ? margin - prevMargin : null,
    aov,
    aovDelta: p && prevAov ? (aov / prevAov - 1) * 100 : null,
    retention: ret.value,
    retentionKind: ret.kind,
    retentionDelta: retPrev && ret.kind === retPrev.kind ? ret.value - retPrev.value : null,
    orders: ord,
    window: w,
    compareLabel: range === "30d" ? "vs previous 30 days" : range === "qtd" ? "vs same days last quarter" : "H1 buyers who purchased again since July",
  };
  kpiCache.set(key, out);
  return out;
}

// ---------------------------------------------------------------- trend series
export interface TrendPoint {
  label: string;
  revenue: number;
  profit: number;
  orders: number;
}
export function trendSeries(db: DB, range: RangeKey, f: ChannelFilter): TrendPoint[] {
  const a = aggregates(db);
  const w = windowFor(range, 0)!;
  const mk = (label: string, s: number, e: number): TrendPoint => {
    const sub = { start: s, end: e };
    const rev = sumRange(a.rev, f, sub);
    return { label, revenue: rev, profit: rev - sumRange(a.cogs, f, sub), orders: sumRange(a.ord, f, sub) };
  };
  const fmt = (d: number) => new Date(dayIso(d) + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const out: TrendPoint[] = [];
  if (range === "30d") {
    for (let d = w.start; d <= w.end; d++) out.push(mk(fmt(d), d, d));
  } else if (range === "qtd") {
    for (let s = w.start; s <= w.end; s += 7) out.push(mk(`Wk of ${fmt(s)}`, s, Math.min(s + 6, w.end)));
  } else {
    for (let m = 0; m < 11; m++) {
      const s = dayIndex(`2026-${String(m + 1).padStart(2, "0")}-01`);
      const e = m === 10 ? w.end : dayIndex(`2026-${String(m + 2).padStart(2, "0")}-01`) - 1;
      out.push(mk(new Date(Date.UTC(2026, m, 1)).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }), s, e));
    }
  }
  return out;
}

// ---------------------------------------------------------------- category breakdown
export interface CategorySlice {
  name: string;
  value: number;
  share: number;
}
export function categoryBreakdown(db: DB, range: RangeKey, f: ChannelFilter): CategorySlice[] {
  const w = windowFor(range, 0)!;
  const allowed = chans(f);
  const by = new Map<string, number>();
  for (let o = 0; o < db.nOrders; o++) {
    const d = db.o_day[o];
    if (d < w.start || d > w.end || !isCounted(db.o_status[o]) || !allowed.includes(db.o_ch[o])) continue;
    const ratio = db.o_gross[o] ? db.o_total[o] / db.o_gross[o] : 1;
    for (let j = db.o_itemStart[o]; j < db.o_itemStart[o + 1]; j++) {
      const cat = db.catOf[db.i_prod[j]];
      by.set(cat, (by.get(cat) ?? 0) + db.i_qty[j] * db.i_price[j] * ratio);
    }
  }
  const total = [...by.values()].reduce((x, y) => x + y, 0) || 1;
  return [...by.entries()].map(([name, value]) => ({ name, value, share: (value / total) * 100 })).sort((x, y) => y.value - x.value);
}

// ---------------------------------------------------------------- velocity
export interface VelocityRow {
  id: number;
  name: string;
  category: string;
  unitsPerWeek: number;
  stock: number;
  reorderLevel: number;
  coverWeeks: number;
  low: boolean;
}
export function topVelocity(db: DB, range: RangeKey, f: ChannelFilter, limit = 5): VelocityRow[] {
  const w = windowFor(range, 0)!;
  const allowed = chans(f);
  const units = new Float64Array(db.products.length);
  for (let o = 0; o < db.nOrders; o++) {
    const d = db.o_day[o];
    if (d < w.start || d > w.end || !isCounted(db.o_status[o]) || !allowed.includes(db.o_ch[o])) continue;
    for (let j = db.o_itemStart[o]; j < db.o_itemStart[o + 1]; j++) units[db.i_prod[j]] += db.i_qty[j];
  }
  const weeks = (w.end - w.start + 1) / 7;
  return db.products
    .map((p, i) => {
      const upw = units[i] / weeks;
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        unitsPerWeek: upw,
        stock: p.stock_quantity,
        reorderLevel: p.reorder_level,
        coverWeeks: upw ? p.stock_quantity / upw : 99,
        low: p.stock_quantity < p.reorder_level,
      };
    })
    .sort((a, b) => b.unitsPerWeek - a.unitsPerWeek)
    .slice(0, limit);
}

// ---------------------------------------------------------------- attention list
export interface AttentionItem {
  id: string;
  tone: "bad" | "warn" | "info";
  title: string;
  detail: string;
  href: string;
}
export function attention(db: DB): AttentionItem[] {
  const low = db.products
    .filter((p) => p.stock_quantity < p.reorder_level)
    .sort((a, b) => a.stock_quantity / a.reorder_level - b.stock_quantity / b.reorder_level);
  const spend = new Float64Array(db.customers.length);
  for (let o = 0; o < db.nOrders; o++) if (isCounted(db.o_status[o])) spend[db.o_cust[o]] += db.o_total[o];
  let atRisk = 0;
  let atRiskSpend = 0;
  db.customers.forEach((c, i) => {
    if (c.segment === "At-Risk") {
      atRisk++;
      atRiskSpend += spend[i];
    }
  });
  let retNow = 0;
  let ordNow = 0;
  let retPrev = 0;
  let ordPrev = 0;
  for (let o = 0; o < db.nOrders; o++) {
    const d = db.o_day[o];
    if (d >= TODAY_IDX - 7) {
      ordNow++;
      if (db.o_status[o] === 2) retNow++;
    } else if (d >= TODAY_IDX - 14) {
      ordPrev++;
      if (db.o_status[o] === 2) retPrev++;
    }
  }
  const rNow = (retNow / ordNow) * 100;
  const rPrev = (retPrev / ordPrev) * 100;
  return [
    {
      id: "stock",
      tone: "bad",
      title: `${low.length} SKUs are below reorder level`,
      detail: low.slice(0, 3).map((p) => p.name).join(", ") + (low.length > 3 ? ` and ${low.length - 3} more` : ""),
      href: "/app/ask?q=Which SKUs will stock out in 14 days?",
    },
    {
      id: "risk",
      tone: "warn",
      title: `${atRisk.toLocaleString("en-US")} customers are At-Risk`,
      detail: `${atRiskSpend >= 1e6 ? `$${(atRiskSpend / 1e6).toFixed(2)}M` : `$${Math.round(atRiskSpend / 1000)}K`} spent over the past year, no order in 90+ days`,
      href: "/app/ask?q=Who are our top VIP customers by lifetime value?",
    },
    {
      id: "returns",
      tone: "info",
      title: `Returns at ${rNow.toFixed(1)}% this week`,
      detail: `${rNow >= rPrev ? "Up" : "Down"} from ${rPrev.toFixed(1)}% the week before`,
      href: "/app/ask",
    },
  ];
}

/** Retention for the last four 30-day windows, oldest first (drives the KPI sparkline). */
export function retentionSeries(db: DB, f: ChannelFilter): number[] {
  const out: number[] = [];
  for (let k = 3; k >= 0; k--) {
    const r = retention(db, "30d", f, k);
    if (r) out.push(r.value);
  }
  return out;
}
