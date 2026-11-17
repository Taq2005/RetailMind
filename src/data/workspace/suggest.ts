import type { TableInfo } from "./types";

const words = (s: string) => s.replace(/_/g, " ");
const MONEYISH = /revenue|sales|amount|total|price|profit|cost|income|spend|value|payment/i;
const QTYISH = /qty|quantity|units|count|stock/i;

/** Starter questions built from the user's own columns, so they are always answerable. */
export function suggestQuestions(tables: TableInfo[], max = 6): string[] {
  const out: string[] = [];
  for (const t of tables) {
    const nums = t.columns.filter((c) => c.kind === "number" && !/(^|_)(id|code|zip|phone)$/i.test(c.name));
    const cats = t.columns.filter((c) => c.kind === "text" && (c.profile?.distinct ?? 99) > 1 && (c.profile?.distinct ?? 99) <= Math.max(30, t.rowCount / 3));
    const dates = t.columns.filter((c) => c.kind === "date");
    const money = nums.find((c) => MONEYISH.test(c.name)) ?? nums[0];
    const qty = nums.find((c) => QTYISH.test(c.name) && c !== money);
    const cat = cats[0];
    const cat2 = cats[1];
    const date = dates[0];
    const tn = words(t.name);
    if (money && cat) out.push(`Which ${words(cat.name)} has the highest total ${words(money.name)}?`);
    if (money && date) out.push(`How does total ${words(money.name)} change by month?`);
    if (qty && cat) out.push(`Top 10 ${words(cat.name)} by ${words(qty.name)}`);
    if (money && cat2) out.push(`Show total ${words(money.name)} by ${words(cat2.name)}`);
    if (cat) out.push(`How many rows are there per ${words(cat.name)}?`);
    out.push(`How many rows are in ${tn}?`);
  }
  return [...new Set(out)].slice(0, max);
}
