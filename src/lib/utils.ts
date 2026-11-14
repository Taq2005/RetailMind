import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fmtUSD = (n: number, opts: { compact?: boolean; decimals?: number } = {}) => {
  const { compact = false, decimals = 0 } = opts;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : decimals,
    minimumFractionDigits: compact ? 0 : decimals,
  }).format(n);
};
/** $1.30M above a million, otherwise $828K. Keeps two decimals where the millions matter. */
export const money = (n: number) => (Math.abs(n) >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : Math.abs(n) >= 1000 ? `$${Math.round(n / 1000)}K` : `$${Math.round(n)}`);
export const fmtInt = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));
export const fmtPct = (n: number, d = 1) => `${n.toFixed(d)}%`;

export function relativeTime(iso: string, now = new Date("2026-11-14T00:40:00+05:00")) {
  const diff = Math.max(0, now.getTime() - new Date(iso).getTime());
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
