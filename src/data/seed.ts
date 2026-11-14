/**
 * Deterministic seed for the Northwind Apparel & Tech demo workspace.
 *
 * One year of omnichannel orders (2025-11-14 .. 2026-11-13, "today" is 2026-11-14),
 * generated from a seeded PRNG and then calibrated so the headline KPIs land on
 * the figures shown in the product:
 *   revenue (last 30d) = $1.24M, +12.4% vs the previous 30d
 *   net profit margin  = 28.4%
 *   average order value = $142.50
 *   customer retention = 42.1%
 *
 * Orders and items are kept in columnar typed arrays (about 100k orders) so the
 * browser stays fast; row objects are materialised on demand.
 */
import type {
  Category,
  Channel,
  Connector,
  Customer,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  Region,
  Segment,
} from "./types";

// ---------------------------------------------------------------- constants
export const DAY0_UTC = Date.UTC(2025, 10, 14);
export const N_DAYS = 365; // day indexes 0..364
export const TODAY_IDX = 365;
export const W_START = 335; // 2026-10-15
export const W_END = 364; // 2026-11-13
export const P_START = 305; // 2026-09-15
export const P_END = 334; // 2026-10-14

export const TARGETS = {
  revenue: 1_240_000,
  mom: 0.124,
  margin: 0.284,
  aov: 142.5,
  retention: 0.421,
  arr: 12_000_000,
} as const;

const N_W = Math.round(TARGETS.revenue / TARGETS.aov); // 8702 counted orders
const R_P = TARGETS.revenue / (1 + TARGETS.mom);
const N_P = 7926;
const AOV_REST_GUESS = 134;

export const dayIso = (d: number) => new Date(DAY0_UTC + d * 86_400_000).toISOString().slice(0, 10);
export const dayIndex = (iso: string) => Math.round((Date.parse(iso + "T00:00:00Z") - DAY0_UTC) / 86_400_000);

// ---------------------------------------------------------------- prng
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- catalogue
type ProductSeed = {
  name: string;
  cat: Category;
  price: number;
  /** relative popularity boost for flagship items */
  boost?: number;
  /** margin erosion: cost climbs by `g` between day 170 and day 364 */
  erosion?: number;
  /** price-war: extra markdown probability late in the year */
  priceWar?: number;
};

const COST_RATIO: Record<Category, number> = {
  Outerwear: 0.55,
  Denim: 0.52,
  Footwear: 0.58,
  Accessories: 0.5,
  Audio: 0.72,
  Wearables: 0.7,
  "Laptops & Tablets": 0.84,
  "Smart Home": 0.7,
};

const CATALOGUE: ProductSeed[] = [
  // Outerwear
  { name: "Harbor Wool Peacoat", cat: "Outerwear", price: 189 },
  { name: "Alpine Down Parka", cat: "Outerwear", price: 249, erosion: 0.19 },
  { name: "Coastline Rain Shell", cat: "Outerwear", price: 139, boost: 1.4 },
  { name: "Fieldman Waxed Jacket", cat: "Outerwear", price: 219 },
  { name: "Canyon Fleece Half-Zip", cat: "Outerwear", price: 89, boost: 1.5 },
  { name: "Metro Bomber", cat: "Outerwear", price: 159 },
  { name: "Quilted Liner Vest", cat: "Outerwear", price: 119 },
  // Denim
  { name: "Slim Selvedge Jean", cat: "Denim", price: 128, boost: 2.2 },
  { name: "Straight Raw Denim", cat: "Denim", price: 118 },
  { name: "Relaxed Tapered Jean", cat: "Denim", price: 98, boost: 1.4 },
  { name: "Denim Trucker Jacket", cat: "Denim", price: 148 },
  { name: "High-Rise Wide Leg", cat: "Denim", price: 108, boost: 1.3 },
  { name: "Stretch Skinny Jean", cat: "Denim", price: 88, erosion: -0.05 },
  { name: "Cargo Denim Short", cat: "Denim", price: 78 },
  // Footwear
  { name: "Daily Runner Mesh", cat: "Footwear", price: 99, boost: 2.4 },
  { name: "Trail Grip Boot", cat: "Footwear", price: 169, erosion: 0.14 },
  { name: "Leather Court Sneaker", cat: "Footwear", price: 129, boost: 1.3 },
  { name: "Suede Chelsea Boot", cat: "Footwear", price: 179 },
  { name: "Recovery Slide", cat: "Footwear", price: 39, boost: 1.2 },
  { name: "Canvas Low-Top", cat: "Footwear", price: 59, boost: 1.2 },
  { name: "Waterproof Hiker Mid", cat: "Footwear", price: 149 },
  // Accessories
  { name: "Merino Beanie", cat: "Accessories", price: 29, boost: 1.6 },
  { name: "Full-Grain Leather Belt", cat: "Accessories", price: 49 },
  { name: "Canvas Weekender Tote", cat: "Accessories", price: 45 },
  { name: "Lambswool Scarf", cat: "Accessories", price: 59 },
  { name: "Crossbody Sling", cat: "Accessories", price: 79 },
  { name: "Hiking Sock 3-Pack", cat: "Accessories", price: 24, boost: 1.5 },
  { name: "Polarized Sunglasses", cat: "Accessories", price: 89 },
  // Audio
  { name: "Studio Wireless Headphones", cat: "Audio", price: 249, boost: 1.2 },
  { name: "Bud Pro ANC Earbuds", cat: "Audio", price: 179, boost: 2.8, priceWar: 0.55 },
  { name: "Mini Bluetooth Speaker", cat: "Audio", price: 69, boost: 1.4 },
  { name: "Soundbar 2.1", cat: "Audio", price: 199 },
  { name: "Wired Studio Monitors", cat: "Audio", price: 149 },
  { name: "USB Podcast Mic", cat: "Audio", price: 119 },
  { name: "Turntable Speaker Dock", cat: "Audio", price: 129 },
  // Wearables
  { name: "Pulse Fitness Band", cat: "Wearables", price: 79, boost: 2.0 },
  { name: "Aero Smartwatch", cat: "Wearables", price: 249, erosion: 0.16, priceWar: 0.3 },
  { name: "Sleep Ring", cat: "Wearables", price: 199 },
  { name: "Kids Tracker Watch", cat: "Wearables", price: 59 },
  { name: "Watch Band 3-Pack", cat: "Wearables", price: 29, boost: 1.3 },
  { name: "GPS Run Watch", cat: "Wearables", price: 329 },
  { name: "Charging Dock Trio", cat: "Wearables", price: 49, boost: 1.2 },
  // Laptops & Tablets
  { name: "Slate 11 Tablet", cat: "Laptops & Tablets", price: 449 },
  { name: "Slate 13 Pro Tablet", cat: "Laptops & Tablets", price: 699 },
  { name: "Ultralight 14 Laptop", cat: "Laptops & Tablets", price: 1099, erosion: 0.12 },
  { name: "Creator 16 Laptop", cat: "Laptops & Tablets", price: 1599 },
  { name: "Student Chromebook", cat: "Laptops & Tablets", price: 299, boost: 1.8 },
  { name: "Stylus Pen", cat: "Laptops & Tablets", price: 79, boost: 1.6 },
  { name: "14-inch Laptop Sleeve", cat: "Laptops & Tablets", price: 39, boost: 1.5 },
  { name: "65W USB-C Charger", cat: "Laptops & Tablets", price: 39, boost: 1.6 },
  { name: "8-in-1 Docking Hub", cat: "Laptops & Tablets", price: 89 },
  // Smart Home
  { name: "Mesh Wi-Fi 3-Pack", cat: "Smart Home", price: 229, erosion: 0.13, priceWar: 0.2 },
  { name: "Video Doorbell", cat: "Smart Home", price: 129, boost: 1.3 },
  { name: "Smart Plug 4-Pack", cat: "Smart Home", price: 34, boost: 1.8 },
  { name: "Indoor Cam 2K", cat: "Smart Home", price: 59, boost: 1.3 },
  { name: "Smart Thermostat", cat: "Smart Home", price: 149 },
  { name: "LED Light Strip", cat: "Smart Home", price: 39, boost: 1.2 },
  { name: "Air Quality Monitor", cat: "Smart Home", price: 79 },
];

const CAT_WEIGHT: Record<Channel, Record<Category, number>> = {
  Online: {
    Outerwear: 1.0,
    Denim: 0.9,
    Footwear: 1.0,
    Accessories: 0.9,
    Audio: 1.3,
    Wearables: 1.2,
    "Laptops & Tablets": 1.0,
    "Smart Home": 1.3,
  },
  "In-Store": {
    Outerwear: 1.3,
    Denim: 1.4,
    Footwear: 1.3,
    Accessories: 1.4,
    Audio: 0.8,
    Wearables: 0.8,
    "Laptops & Tablets": 0.7,
    "Smart Home": 0.6,
  },
};

const OUTERWEAR_BY_MONTH = [1.6, 1.4, 1.0, 0.7, 0.5, 0.4, 0.4, 0.5, 0.8, 1.3, 1.6, 1.8];

// ---------------------------------------------------------------- seasonality
function shape(d: number): number {
  const dt = new Date(DAY0_UTC + d * 86_400_000);
  const y = dt.getUTCFullYear();
  const m = dt.getUTCMonth();
  const day = dt.getUTCDate();
  const dow = dt.getUTCDay();
  const monthBase = [0.8, 0.84, 0.95, 0.98, 1.02, 0.98, 1.04, 1.08, 1.0, 1.06, 1.18, 1.52][m];
  let s = monthBase * [1.0, 0.92, 0.9, 0.93, 0.97, 1.12, 1.18][dow];
  if (y === 2025 && m === 10 && day === 28) s *= 2.7;
  else if (y === 2025 && m === 10 && day === 27) s *= 1.2;
  else if (y === 2025 && m === 10 && day >= 29) s *= 1.45;
  else if (y === 2025 && m === 11 && day === 1) s *= 2.0;
  else if (m === 11 && day >= 15 && day <= 23) s *= 1.25;
  else if (m === 11 && day === 24) s *= 0.8;
  else if (m === 11 && day === 25) s *= 0.12;
  else if (m === 11 && day === 26) s *= 1.3;
  if (y === 2026 && m === 6 && day >= 11 && day <= 13) s *= 1.45;
  if (y === 2026 && m === 7 && day >= 15) s *= 1.08;
  if (y === 2026 && m === 10 && day === 11) s *= 1.35;
  else if (y === 2026 && m === 10 && day >= 6) s *= 1.1;
  return s;
}

const isPromoDay = (d: number) => {
  const dt = new Date(DAY0_UTC + d * 86_400_000);
  const y = dt.getUTCFullYear();
  const m = dt.getUTCMonth();
  const day = dt.getUTCDate();
  return (y === 2025 && m === 10 && day >= 27) || (y === 2025 && m === 11 && day <= 2) || (y === 2026 && m === 6 && day >= 11 && day <= 13) || (y === 2026 && m === 10 && day === 11);
};

/** Slow price drift so AOV climbs smoothly through the year. */
const trend = (d: number) => 0.93 + 0.07 * (Math.min(d, N_DAYS - 1) / (N_DAYS - 1));

const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

// ---------------------------------------------------------------- dataset type
export interface DB {
  customers: Customer[];
  products: Product[];
  connectors: Connector[];
  nOrders: number;
  nItems: number;
  // orders, columnar (order id = index + 1)
  o_day: Int16Array;
  o_hour: Uint8Array;
  o_cust: Int32Array;
  o_ch: Uint8Array; // 0 Online, 1 In-Store
  o_status: Uint8Array; // 0 Completed, 1 Processing, 2 Returned, 3 Cancelled
  o_total: Float64Array;
  o_disc: Float64Array;
  o_gross: Float64Array;
  o_itemStart: Int32Array; // length nOrders + 1
  // items, columnar (item id = index + 1)
  i_order: Int32Array;
  i_prod: Int16Array;
  i_qty: Uint8Array;
  i_price: Float64Array;
  i_margin: Float64Array;
  /** product index -> category index helper */
  catOf: Category[];
  calibration: { retailScale: number; kWindow: number; kPrev: number; costFactor: number };
}

export const STATUS_NAMES: OrderStatus[] = ["Completed", "Processing", "Returned", "Cancelled"];
export const CHANNEL_NAMES: Channel[] = ["Online", "In-Store"];
export const isCounted = (s: number) => s === 0 || s === 1;

// ---------------------------------------------------------------- generator
const FIRST = ["Ava", "Liam", "Noah", "Emma", "Olivia", "Mateo", "Sofia", "Lucas", "Isabella", "Ethan", "Mia", "Amir", "Priya", "Chen", "Yuki", "Hana", "Omar", "Layla", "Diego", "Camila", "Sven", "Ingrid", "Kofi", "Amara", "Rohan", "Meera", "Jin", "Mina", "Tariq", "Zainab", "Felix", "Clara", "Hugo", "Elena", "Nikolai", "Anya", "Bruno", "Marta", "Dev", "Aisha", "Jonas", "Freya", "Santiago", "Valentina", "Kenji", "Sakura", "Ibrahim", "Fatima", "Theo", "Nora"];
const LAST = ["Okafor", "Nguyen", "Patel", "Garcia", "Kim", "Silva", "Haddad", "Johansson", "Tanaka", "Mueller", "Rossi", "Santos", "Singh", "Cohen", "Murphy", "Dubois", "Kowalski", "Ali", "Chen", "Park", "Lopez", "Moreau", "Fischer", "Novak", "Brown", "Wilson", "Hernandez", "Das", "Rahman", "Ito", "Larsen", "Costa", "Mendez", "Bianchi", "Ahmed", "Reyes", "Walker", "Young", "Bennett", "Torres", "Khan", "Sato", "Ivanov", "Ortiz", "Lindqvist", "Abebe", "Hughes", "Diaz", "Mbeki", "Clarke"];
const DOMAINS = ["gmail.com", "outlook.com", "icloud.com", "yahoo.com", "proton.me", "fastmail.com"];
const REGIONS: Region[] = ["North America", "EMEA", "APAC", "LATAM"];
const REGION_W = [0.46, 0.28, 0.19, 0.07];

export const N_CUSTOMERS = 20000;

export function generateDB(): DB {
  const rnd = mulberry32(20261114);
  const gauss = () => {
    const u = Math.max(rnd(), 1e-9);
    const v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const pickW = (weights: number[], total: number) => {
    let r = rnd() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return i;
    }
    return weights.length - 1;
  };

  // ---------- products (base values; cost and retail are calibrated later)
  const nP = CATALOGUE.length;
  const costBase = CATALOGUE.map((p) => p.price * COST_RATIO[p.cat]);
  const retailBase = CATALOGUE.map((p) => p.price);
  const pop = CATALOGUE.map((p) => Math.pow(p.price, -1.1) * Math.exp(0.3 * gauss()) * (p.boost ?? 1));
  const drift = (pi: number, d: number) => {
    const e = CATALOGUE[pi].erosion ?? 0;
    return 1 + e * smooth((d - 170) / (N_DAYS - 1 - 170));
  };
  const lateBoost = (pi: number, d: number) => (CATALOGUE[pi].priceWar ?? 0) * smooth((d - 200) / 165);

  // ---------- customers
  const custCreated = new Int16Array(N_CUSTOMERS);
  const custRegion = new Uint8Array(N_CUSTOMERS);
  const custW = new Float64Array(N_CUSTOMERS);
  const custChurn = new Int16Array(N_CUSTOMERS);
  const idxs = Array.from({ length: N_CUSTOMERS }, (_, i) => i);
  const regionRaw = idxs.map(() => pickW(REGION_W, 1));
  const createdRaw = idxs.map((i) =>
    regionRaw[i] === 2
      ? -Math.floor(Math.pow(rnd(), 1.9) * 1080) + Math.floor(rnd() < 0.45 ? 365 * rnd() : 0)
      : -Math.floor(Math.pow(rnd(), 0.8) * 1080) + Math.floor(rnd() < 0.18 ? 365 * rnd() : 0)
  );
  // sort by created day so eligibility is a prefix
  const order = idxs.sort((a, b) => createdRaw[a] - createdRaw[b]);
  for (let k = 0; k < N_CUSTOMERS; k++) {
    const src = order[k];
    custCreated[k] = Math.min(createdRaw[src], N_DAYS - 1);
    custRegion[k] = regionRaw[src];
    custW[k] = Math.min(6, Math.exp(0.75 * gauss()));
    custChurn[k] = rnd() < 0.5 ? 9999 : Math.round(custCreated[k] + 45 + -Math.log(Math.max(rnd(), 1e-9)) * 200);
  }
  const cumW = new Float64Array(N_CUSTOMERS);
  let acc = 0;
  for (let k = 0; k < N_CUSTOMERS; k++) {
    acc += custW[k];
    cumW[k] = acc;
  }
  const eligibleN = new Int32Array(N_DAYS);
  {
    let p = 0;
    for (let d = 0; d < N_DAYS; d++) {
      while (p < N_CUSTOMERS && custCreated[p] <= d) p++;
      eligibleN[d] = Math.max(p, 1);
    }
  }
  const pickCustomer = (d: number) => {
    const n = eligibleN[d];
    for (let tries = 0; tries < 30; tries++) {
      const target = rnd() * cumW[n - 1];
      let lo = 0;
      let hi = n - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (cumW[mid] < target) lo = mid + 1;
        else hi = mid;
      }
      if (custChurn[lo] >= d) return lo;
    }
    return Math.min(n - 1, Math.floor(rnd() * n));
  };

  // ---------- daily order counts (counted orders only)
  const counted = new Int32Array(N_DAYS);
  const restDays: number[] = [];
  for (let d = 0; d < N_DAYS; d++) if (d < P_START) restDays.push(d);
  const restShape = restDays.reduce((s, d) => s + shape(d), 0);
  const restRevenue = TARGETS.arr - TARGETS.revenue - R_P;
  const scaleRest = restRevenue / AOV_REST_GUESS / restShape;
  for (const d of restDays) counted[d] = Math.max(8, Math.round(scaleRest * shape(d) * (1 + 0.05 * gauss())));
  const distribute = (start: number, end: number, total: number) => {
    const w: number[] = [];
    for (let d = start; d <= end; d++) w.push(shape(d) * (1 + 0.05 * gauss()));
    const sum = w.reduce((a, b) => a + b, 0);
    const raw = w.map((x) => (x / sum) * total);
    const flo = raw.map(Math.floor);
    let rem = total - flo.reduce((a, b) => a + b, 0);
    const order2 = raw.map((x, i) => [x - Math.floor(x), i] as const).sort((a, b) => b[0] - a[0]);
    for (let k = 0; rem > 0; k++, rem--) flo[order2[k % order2.length][1]]++;
    flo.forEach((n, i) => (counted[start + i] = n));
  };
  distribute(W_START, W_END, N_W);
  distribute(P_START, P_END, N_P);

  // ---------- orders + raw lines
  const o_day: number[] = [];
  const o_hour: number[] = [];
  const o_cust: number[] = [];
  const o_ch: number[] = [];
  const o_status: number[] = [];
  const o_rate: number[] = []; // order discount rate
  const o_itemStart: number[] = [];
  const i_prod: number[] = [];
  const i_qty: number[] = [];
  const i_md: number[] = []; // markdown fraction
  const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
  const HOUR_W = [3, 5, 7, 8, 7, 6, 6, 7, 8, 9, 10, 9, 6, 3];
  const HOUR_TOT = HOUR_W.reduce((a, b) => a + b, 0);

  const pickT = (weights: Float64Array, total: number) => {
    let r = rnd() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return i;
    }
    return weights.length - 1;
  };
  const dowOf = (d: number) => new Date(DAY0_UTC + d * 86_400_000).getUTCDay();
  const prodWeights = new Float64Array(nP);
  const buildWeights = (ch: Channel, m: number) => {
    let tot = 0;
    for (let p = 0; p < nP; p++) {
      const c = CATALOGUE[p].cat;
      let w = pop[p] * CAT_WEIGHT[ch][c];
      if (c === "Outerwear") w *= OUTERWEAR_BY_MONTH[m];
      if (c === "Audio" || c === "Wearables") w *= m >= 10 ? 1.35 : 1;
      if (c === "Laptops & Tablets") w *= m === 7 || m === 8 ? 1.4 : 1;
      prodWeights[p] = w;
      tot += w;
    }
    return tot;
  };
  const weightCache = new Map<string, number>();
  const wCache = new Map<string, Float64Array>();
  const weightsFor = (ch: Channel, m: number) => {
    const key = ch + m;
    if (!wCache.has(key)) {
      const tot = buildWeights(ch, m);
      wCache.set(key, Float64Array.from(prodWeights));
      weightCache.set(key, tot);
    }
    return { w: wCache.get(key)!, tot: weightCache.get(key)! };
  };
  const LINE_P = [0.6, 0.25, 0.1, 0.03, 0.02];

  for (let d = 0; d < N_DAYS; d++) {
    const m = new Date(DAY0_UTC + d * 86_400_000).getUTCMonth();
    const promo = isPromoDay(d);
    const nCounted = counted[d];
    const nExtra = Math.round(nCounted * (0.068 + 0.012 * gauss()));
    const total = nCounted + nExtra;
    const extraMask: boolean[] = Array.from({ length: total }, (_, i) => i >= nCounted);
    for (let i = extraMask.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [extraMask[i], extraMask[j]] = [extraMask[j], extraMask[i]];
    }
    for (let n = 0; n < total; n++) {
      const dow = dowOf(d);
      const pOnline = (dow === 6 ? 0.52 : 0.62) + (promo ? 0.1 : 0);
      const ch = rnd() < pOnline ? 0 : 1;
      const chName = CHANNEL_NAMES[ch];
      let status = 0;
      if (extraMask[n]) status = rnd() < 0.6 ? 2 : 3;
      else if (d === N_DAYS - 1) status = rnd() < 0.55 ? 1 : 0;
      else if (d === N_DAYS - 2) status = rnd() < 0.18 ? 1 : 0;
      o_day.push(d);
      o_hour.push(HOURS[pickW(HOUR_W, HOUR_TOT)]);
      const cust = pickCustomer(d);
      o_cust.push(cust);
      o_ch.push(ch);
      o_status.push(status);
      const hasPromo = rnd() < (promo ? 0.75 : ch === 0 ? 0.3 : 0.18);
      o_rate.push(hasPromo ? (promo ? 0.15 + rnd() * 0.15 : 0.05 + rnd() * 0.15) : 0);
      o_itemStart.push(i_prod.length);
      let lines = 1;
      let r = rnd();
      for (let k = 0; k < LINE_P.length; k++) {
        r -= LINE_P[k];
        if (r <= 0) {
          lines = k + 1;
          break;
        }
      }
      if (ch === 1 && rnd() < 0.2) lines++;
      const reg = custRegion[cust];
      if (reg === 1 && rnd() < 0.14) lines++;
      if (reg === 3 && lines > 1 && rnd() < 0.12) lines--;
      const { w, tot } = weightsFor(chName, m);
      const chosen: number[] = [];
      for (let l = 0; l < lines; l++) {
        let p = -1;
        for (let t = 0; t < 4; t++) {
          p = pickT(w, tot);
          if (!chosen.includes(p)) break;
        }
        if (chosen.includes(p)) continue;
        chosen.push(p);
        const q = rnd() < 0.88 ? 1 : rnd() < 0.83 ? 2 : 3;
        const mdChance = 0.1 + lateBoost(p, d);
        const md = rnd() < mdChance ? 0.1 + rnd() * 0.15 : 0;
        i_prod.push(p);
        i_qty.push(q);
        i_md.push(md);
      }
    }
  }
  o_itemStart.push(i_prod.length);
  const nOrders = o_day.length;
  const nItems = i_prod.length;
  const i_order = new Int32Array(nItems);
  for (let o = 0; o < nOrders; o++) for (let j = o_itemStart[o]; j < o_itemStart[o + 1]; j++) i_order[j] = o;

  // ---------- price calibration
  const netRev = (start: number, end: number, retail: ArrayLike<number>, window: number) => {
    let s = 0;
    for (let o = 0; o < nOrders; o++) {
      const d = o_day[o];
      if (d < start || d > end || !isCounted(o_status[o])) continue;
      let g = 0;
      for (let j = o_itemStart[o]; j < o_itemStart[o + 1]; j++) g += i_qty[j] * retail[i_prod[j]] * (1 - i_md[j]) * trend(d);
      s += g * (1 - o_rate[o]);
    }
    return s * window;
  };
  const retailScale = TARGETS.revenue / netRev(W_START, W_END, retailBase, 1);
  const retail = retailBase.map((p) => Math.max(5, Math.round(p * retailScale)));
  const kWindow = TARGETS.revenue / netRev(W_START, W_END, retail, 1);
  const kPrev = R_P / netRev(P_START, P_END, retail, 1);
  const kFor = (d: number) => (d >= W_START ? kWindow : d >= P_START ? kPrev : 1);

  const i_price = new Float64Array(nItems);
  const o_gross = new Float64Array(nOrders);
  const o_disc = new Float64Array(nOrders);
  const o_total = new Float64Array(nOrders);
  for (let o = 0; o < nOrders; o++) {
    const d = o_day[o];
    const k = kFor(d) * trend(d);
    let g = 0;
    for (let j = o_itemStart[o]; j < o_itemStart[o + 1]; j++) {
      const price = Math.round(retail[i_prod[j]] * (1 - i_md[j]) * k * 100) / 100;
      i_price[j] = price;
      g += price * i_qty[j];
    }
    g = Math.round(g * 100) / 100;
    const disc = Math.round(g * o_rate[o] * 100) / 100;
    o_gross[o] = g;
    o_disc[o] = disc;
    o_total[o] = Math.round((g - disc) * 100) / 100;
  }

  // ---------- cost calibration -> net margin 28.4% in the last 30 days
  let cogsBase = 0;
  let revW = 0;
  for (let o = 0; o < nOrders; o++) {
    const d = o_day[o];
    if (d < W_START || d > W_END || !isCounted(o_status[o])) continue;
    revW += o_total[o];
    for (let j = o_itemStart[o]; j < o_itemStart[o + 1]; j++) cogsBase += i_qty[j] * costBase[i_prod[j]] * drift(i_prod[j], d);
  }
  const costFactor = ((1 - TARGETS.margin) * revW) / cogsBase;
  // previous 30 days ran slightly thinner (supplier surcharge that has since rolled off)
  let cogsBaseP = 0;
  let revP = 0;
  for (let o = 0; o < nOrders; o++) {
    const d = o_day[o];
    if (d < P_START || d > P_END || !isCounted(o_status[o])) continue;
    revP += o_total[o];
    for (let j = o_itemStart[o]; j < o_itemStart[o + 1]; j++) cogsBaseP += i_qty[j] * costBase[i_prod[j]] * drift(i_prod[j], d);
  }
  const prevCostAdj = ((1 - 0.278) * revP) / (cogsBaseP * costFactor);
  const i_margin = new Float64Array(nItems);
  for (let j = 0; j < nItems; j++) {
    const o = i_order[j];
    const p = i_prod[j];
    const d = o_day[o];
    const adj = d >= P_START && d <= P_END ? prevCostAdj : 1;
    const cost = costBase[p] * drift(p, d) * costFactor * adj;
    i_margin[j] = Math.round(((i_price[j] - cost) / i_price[j]) * 10000) / 100;
  }

  // ---------- retention calibration (previous window first, then the latest one)
  const fixRetention = (cs: number, ce: number, ps: number, pe: number, target: number) => {
    const A = new Set<number>();
    for (let o = 0; o < nOrders; o++) if (o_day[o] >= ps && o_day[o] <= pe && isCounted(o_status[o])) A.add(o_cust[o]);
    const byCust = new Map<number, number[]>();
    for (let o = 0; o < nOrders; o++) {
      if (o_day[o] < cs || o_day[o] > ce || !isCounted(o_status[o])) continue;
      const arr = byCust.get(o_cust[o]);
      if (arr) arr.push(o);
      else byCust.set(o_cust[o], [o]);
    }
    let retained = 0;
    for (const c of byCust.keys()) if (A.has(c)) retained++;
    const T = Math.round(target * A.size);
    if (retained < T) {
      const cand = [...A].filter((c) => !byCust.has(c)).sort((a, b) => b - a);
      const donors = [...byCust.entries()].filter(([c]) => !A.has(c)).sort((a, b) => b[1].length - a[1].length);
      let di = 0;
      while (retained < T && cand.length && di < donors.length) {
        const [dc, ords] = donors[di];
        if (ords.length === 0) {
          di++;
          continue;
        }
        const a = cand.pop()!;
        const ord = ords.pop()!;
        o_cust[ord] = a;
        byCust.set(a, [ord]);
        if (ords.length === 0) byCust.delete(dc);
        retained++;
        if (ords.length <= 1) di++;
      }
    } else if (retained > T) {
      const both = [...byCust.keys()].filter((c) => A.has(c)).sort((a, b) => a - b);
      const fresh: number[] = [];
      for (let k = N_CUSTOMERS - 1; k >= 0 && fresh.length < both.length; k--) if (custCreated[k] <= cs && !A.has(k) && !byCust.has(k)) fresh.push(k);
      let fi = 0;
      for (const c of both) {
        if (retained <= T || fi >= fresh.length) break;
        const target2 = fresh[fi++];
        for (const ord of byCust.get(c)!) o_cust[ord] = target2;
        retained--;
      }
    }
  };
  fixRetention(P_START, P_END, P_START - 30, P_START - 1, 0.403);
  fixRetention(W_START, W_END, P_START, P_END, TARGETS.retention);

  // ---------- segments (derived from behaviour)
  const spend = new Float64Array(N_CUSTOMERS);
  const nOrd = new Int32Array(N_CUSTOMERS);
  const lastDay = new Int16Array(N_CUSTOMERS).fill(-1);
  for (let o = 0; o < nOrders; o++) {
    if (!isCounted(o_status[o])) continue;
    const c = o_cust[o];
    spend[c] += o_total[o];
    nOrd[c]++;
    if (o_day[o] > lastDay[c]) lastDay[c] = o_day[o];
  }
  const spenders = [...spend].filter((s) => s > 0).sort((a, b) => b - a);
  const vipCut = spenders[Math.floor(spenders.length * 0.09)] ?? Infinity;
  const segOf = (c: number): Segment => {
    if (nOrd[c] >= 2 && lastDay[c] >= 0 && lastDay[c] < TODAY_IDX - 90) return "At-Risk";
    if (spend[c] >= vipCut) return "VIP";
    return "Regular";
  };

  // ---------- customers table
  const nameSeen = new Map<string, number>();
  const customers: Customer[] = [];
  for (let c = 0; c < N_CUSTOMERS; c++) {
    const f = FIRST[Math.floor(rnd() * FIRST.length)];
    const l = LAST[Math.floor(rnd() * LAST.length)];
    const base = `${f}.${l}`.toLowerCase();
    const n = (nameSeen.get(base) ?? 0) + 1;
    nameSeen.set(base, n);
    const hh = Math.floor(rnd() * 24);
    const mm = Math.floor(rnd() * 60);
    const created = new Date(DAY0_UTC + custCreated[c] * 86_400_000 + (hh * 60 + mm) * 60_000).toISOString();
    customers.push({
      id: c + 1,
      name: `${f} ${l}`,
      email: `${base}${n > 1 ? n : ""}@${DOMAINS[Math.floor(rnd() * DOMAINS.length)]}`,
      segment: segOf(c),
      region: REGIONS[custRegion[c]],
      created_at: created,
    });
  }

  // ---------- products table (stock from recent velocity)
  const unitsLast28 = new Float64Array(nP);
  for (let j = 0; j < nItems; j++) {
    const o = i_order[j];
    if (o_day[o] >= N_DAYS - 28 && isCounted(o_status[o])) unitsLast28[i_prod[j]] += i_qty[j];
  }
  const products: Product[] = CATALOGUE.map((p, i) => {
    const vel = Math.max(0.2, unitsLast28[i] / 28);
    const r = rnd();
    const cover = r < 0.12 ? 6 + rnd() * 7 : r < 0.2 ? 14 + rnd() * 6 : r < 0.3 ? 120 + rnd() * 80 : 24 + rnd() * 66;
    return {
      id: i + 1,
      name: p.name,
      category: p.cat,
      cost_price: Math.round(costBase[i] * drift(i, N_DAYS - 1) * costFactor * 100) / 100,
      retail_price: retail[i],
      stock_quantity: Math.max(1, Math.round(vel * cover)),
      reorder_level: Math.max(2, Math.ceil(vel * 12)),
    };
  });

  const toTyped = <T extends Int16Array | Uint8Array | Int32Array>(ctor: new (n: number) => T, arr: number[]) => {
    const t = new ctor(arr.length);
    for (let i = 0; i < arr.length; i++) t[i] = arr[i];
    return t;
  };

  return {
    customers,
    products,
    connectors: CONNECTORS,
    nOrders,
    nItems,
    o_day: toTyped(Int16Array, o_day),
    o_hour: toTyped(Uint8Array, o_hour),
    o_cust: o_cust.length ? Int32Array.from(o_cust) : new Int32Array(0),
    o_ch: toTyped(Uint8Array, o_ch),
    o_status: toTyped(Uint8Array, o_status),
    o_total,
    o_disc,
    o_gross,
    o_itemStart: toTyped(Int32Array, o_itemStart),
    i_order,
    i_prod: toTyped(Int16Array, i_prod),
    i_qty: toTyped(Uint8Array, i_qty),
    i_price,
    i_margin,
    catOf: CATALOGUE.map((p) => p.cat),
    calibration: { retailScale, kWindow, kPrev, costFactor },
  };
}

// ---------------------------------------------------------------- connectors
const minsAgo = (m: number) => new Date(Date.parse("2026-11-14T00:40:00+05:00") - m * 60_000).toISOString();
export const CONNECTORS: Connector[] = [
  { id: 1, name: "Prod Warehouse", type: "PostgreSQL", status: "Healthy", last_sync: minsAgo(4), host_masked: "db-prod-use1.••••••.rds.amazonaws.com", row_count: 2_184_332 },
  { id: 2, name: "Finance Mart", type: "Snowflake", status: "Healthy", last_sync: minsAgo(18), host_masked: "nwtech-fin.us-east-1.••••••.snowflakecomputing.com", row_count: 9_402_117 },
  { id: 3, name: "Shopify Storefront", type: "REST API", status: "Syncing", last_sync: minsAgo(1), host_masked: "northwind-apparel.myshopify.com", row_count: 312_908 },
  { id: 4, name: "POS Export, Store 014", type: "CSV", status: "Healthy", last_sync: minsAgo(212), host_masked: "s3://nw-pos-exports/••••/store-014", row_count: 148_552 },
  { id: 5, name: "Loyalty Platform", type: "REST API", status: "Error", last_sync: minsAgo(60 * 31), host_masked: "api.••••••loyalty.io/v3", row_count: 77_240 },
  { id: 6, name: "Inventory Service", type: "REST API", status: "Healthy", last_sync: minsAgo(9), host_masked: "inventory.int.northwind.••••/graphql", row_count: 18_604 },
  { id: 7, name: "Marketing Spend", type: "Snowflake", status: "Syncing", last_sync: minsAgo(2), host_masked: "nwtech-mkt.eu-west-1.••••••.snowflakecomputing.com", row_count: 1_071_466 },
  { id: 8, name: "Returns Feed", type: "CSV", status: "Healthy", last_sync: minsAgo(95), host_masked: "sftp://returns.••••••.northwind.com/daily", row_count: 41_913 },
];

// ---------------------------------------------------------------- lazy singleton
let cached: DB | null = null;
export function getDB(): DB {
  if (!cached) cached = generateDB();
  return cached;
}
export const peekDB = () => cached;
/** Generates after the next paint so skeletons can render first. */
export function loadDB(): Promise<DB> {
  if (cached) return Promise.resolve(cached);
  return new Promise((resolve) => setTimeout(() => resolve(getDB()), 30));
}

// ---------------------------------------------------------------- row materialisers
export const orderRow = (db: DB, i: number): Order => ({
  id: i + 1,
  customer_id: db.o_cust[i] + 1,
  channel: CHANNEL_NAMES[db.o_ch[i]],
  order_date: `${dayIso(db.o_day[i])}T${String(db.o_hour[i]).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}:${String((i * 13) % 60).padStart(2, "0")}Z`,
  status: STATUS_NAMES[db.o_status[i]],
  total_amount: db.o_total[i],
  discount_amount: db.o_disc[i],
});
export const itemRow = (db: DB, j: number): OrderItem => ({
  id: j + 1,
  order_id: db.i_order[j] + 1,
  product_id: db.i_prod[j] + 1,
  quantity: db.i_qty[j],
  unit_price: db.i_price[j],
  profit_margin: db.i_margin[j],
});
