import type { ArrowTableLike } from "./arrowConvert";

/** The minimal engine surface the workspace needs. Implemented by DuckDB-WASM in the browser. */
export interface DuckLike {
  query(sql: string): Promise<ArrowTableLike>;
  tableNames(sql: string): Promise<string[]>;
  registerText(fileName: string, text: string): Promise<void>;
  dropFile(fileName: string): Promise<void>;
}
