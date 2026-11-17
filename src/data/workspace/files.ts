import type { DuckLike } from "./duckTypes";
import { decodeText, ingestCsv, ingestExcelSheets, IngestError, MAX_FILE_BYTES } from "./ingest";
import type { TableInfo } from "./types";

export const ACCEPTED_EXT = [".csv", ".tsv", ".txt", ".xlsx"];
export const ACCEPT_ATTR = ".csv,.tsv,.txt,.xlsx";

export function extOf(name: string): string {
  const m = /\.[^.]+$/.exec(name.toLowerCase());
  return m ? m[0] : "";
}

export function checkFile(name: string, size: number): string | null {
  const ext = extOf(name);
  if (ext === ".xls") return `${name}: old .xls files are not supported. Save it as .xlsx or .csv and try again.`;
  if (!ACCEPTED_EXT.includes(ext)) return `${name}: unsupported file type. Use CSV, TSV or XLSX.`;
  if (size === 0) return `${name}: the file is empty.`;
  if (size > MAX_FILE_BYTES) return `${name}: larger than ${MAX_FILE_BYTES / 1024 / 1024} MB.`;
  return null;
}

/** Parse one file's bytes into one or more queryable tables. */
export async function ingestFileBytes(
  db: DuckLike,
  fileName: string,
  bytes: ArrayBuffer,
  taken: Iterable<string>,
): Promise<TableInfo[]> {
  const ext = extOf(fileName);
  if (ext === ".xlsx") {
    let sheets;
    try {
      const mod = await import("read-excel-file/browser");
      sheets = await mod.default(bytes);
    } catch {
      throw new IngestError(`${fileName}: could not read this Excel file. Is it a valid .xlsx?`);
    }
    return ingestExcelSheets(db, fileName, sheets as { sheet: string; data: unknown[][] }[], taken);
  }
  const text = decodeText(bytes);
  if (!text.trim()) throw new IngestError(`${fileName}: the file is empty.`);
  return [await ingestCsv(db, { fileName, csv: text }, taken)];
}
