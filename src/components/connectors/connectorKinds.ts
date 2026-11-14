import { Database, FileSpreadsheet, Snowflake, ShoppingBag, type LucideIcon } from "lucide-react";
import type { ConnectorType } from "@/data/types";

export type Kind = "postgres" | "snowflake" | "shopify" | "csv";
export interface KindInfo {
  kind: Kind;
  label: string;
  blurb: string;
  icon: LucideIcon;
  type: ConnectorType;
}
export const KINDS: KindInfo[] = [
  { kind: "postgres", label: "PostgreSQL", blurb: "Read replica or warehouse schema. SSL recommended.", icon: Database, type: "PostgreSQL" },
  { kind: "snowflake", label: "Snowflake", blurb: "Account, warehouse and a read-only role.", icon: Snowflake, type: "Snowflake" },
  { kind: "shopify", label: "Shopify API", blurb: "Orders, products and customers through the Admin API.", icon: ShoppingBag, type: "REST API" },
  { kind: "csv", label: "CSV upload", blurb: "A one-off export from a POS or spreadsheet.", icon: FileSpreadsheet, type: "CSV" },
];

export interface FormValues {
  name: string;
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  account: string;
  warehouse: string;
  shop: string;
  token: string;
}
export const DEFAULTS: FormValues = { name: "", host: "", port: "5432", database: "", user: "", password: "", ssl: true, account: "", warehouse: "", shop: "", token: "" };

export function maskHost(v: FormValues, kind: Kind, fileName?: string): string {
  const mask = (h: string) => {
    const parts = h.split(".");
    if (parts.length <= 2) return h;
    return [parts[0], ...parts.slice(1, -2).map(() => "••••••"), ...parts.slice(-2)].join(".");
  };
  if (kind === "postgres") return mask(v.host);
  if (kind === "snowflake") return `${v.account.split(".")[0].slice(0, 4)}••••.snowflakecomputing.com`;
  if (kind === "shopify") return v.shop.includes(".") ? v.shop : `${v.shop}.myshopify.com`;
  return `upload://${fileName ?? "file.csv"}`;
}

export interface SchemaRow {
  table: string;
  columns: string;
  rows: number;
}

export function previewSchema(kind: Kind): SchemaRow[] {
  switch (kind) {
    case "postgres":
      return [
        { table: "public.orders", columns: "id, customer_id, channel, order_date, status, total_amount, discount_amount", rows: 1_284_902 },
        { table: "public.order_items", columns: "id, order_id, product_id, quantity, unit_price, profit_margin", rows: 2_311_447 },
        { table: "public.customers", columns: "id, name, email, segment, region, created_at", rows: 214_880 },
        { table: "public.products", columns: "id, name, category, cost_price, retail_price, stock_quantity, reorder_level", rows: 4_203 },
      ];
    case "snowflake":
      return [
        { table: "ANALYTICS.FCT_ORDERS", columns: "ORDER_ID, CUSTOMER_ID, CHANNEL, ORDERED_AT, NET_TOTAL, DISCOUNT", rows: 9_402_117 },
        { table: "ANALYTICS.DIM_PRODUCT", columns: "PRODUCT_ID, NAME, CATEGORY, COST, LIST_PRICE", rows: 18_566 },
        { table: "ANALYTICS.DIM_CUSTOMER", columns: "CUSTOMER_ID, EMAIL, SEGMENT, REGION, FIRST_ORDER_AT", rows: 611_034 },
      ];
    case "shopify":
      return [
        { table: "orders", columns: "id, email, created_at, total_price, total_discounts, fulfillment_status", rows: 312_908 },
        { table: "products", columns: "id, title, product_type, variants, status", rows: 1_942 },
        { table: "customers", columns: "id, email, orders_count, total_spent, state", rows: 88_217 },
        { table: "inventory_levels", columns: "inventory_item_id, location_id, available", rows: 6_480 },
      ];
    default:
      return [];
  }
}

/** Deterministic pseudo-latency so the same host always pings the same. */
export function hashMs(s: string, lo: number, hi: number) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return lo + (Math.abs(h) % (hi - lo + 1));
}
