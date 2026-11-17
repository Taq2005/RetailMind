/** Turns arbitrary file, sheet and header names into safe, readable SQL identifiers. */

const NON_WORD = /[^\p{L}\p{N}]+/gu;

export function toIdent(raw: string, fallback: string): string {
  let s = String(raw ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(NON_WORD, "_")
    .replace(/^_+|_+$/g, "");
  if (!s) s = fallback;
  if (/^\p{N}/u.test(s)) s = `c_${s}`;
  return s.slice(0, 63);
}

/** Make a list of names unique by appending _2, _3, ... while keeping order. */
export function uniqueNames(names: string[], taken: Iterable<string> = []): string[] {
  const used = new Set<string>(taken);
  return names.map((n) => {
    let candidate = n;
    let i = 2;
    while (used.has(candidate)) candidate = `${n.slice(0, 60)}_${i++}`;
    used.add(candidate);
    return candidate;
  });
}

export function columnNames(headers: string[]): string[] {
  return uniqueNames(headers.map((h, i) => toIdent(h, `column_${i + 1}`)));
}

export function fileStem(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}

export function tableNameFor(fileName: string, sheet: string | undefined, taken: Iterable<string>): string {
  const base = toIdent(fileStem(fileName), "data");
  const full = sheet ? `${base}_${toIdent(sheet, "sheet")}` : base;
  return uniqueNames([full.slice(0, 63)], taken)[0];
}

/** "total_revenue" -> "Total revenue" for column headings. */
export function prettyLabel(name: string): string {
  const s = name.replace(/_/g, " ").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : name;
}

export const qi = (name: string) => `"${name.replace(/"/g, '""')}"`;
export const ql = (value: string) => `'${value.replace(/'/g, "''")}'`;
