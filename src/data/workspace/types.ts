/** Shared types for the user's uploaded-data workspace. */

export type ColKind = "number" | "date" | "text" | "bool" | "other";

export interface ColumnProfile {
  nulls: number;
  distinct: number;
  min: string | null;
  max: string | null;
  /** Most frequent values, text columns with few distinct values only. */
  top: { value: string; count: number }[];
}

export interface ColumnInfo {
  name: string;
  /** Name as it appeared in the file, kept for display. */
  original: string;
  /** DuckDB type, for example BIGINT, DOUBLE, VARCHAR, DATE, TIMESTAMP. */
  type: string;
  kind: ColKind;
  /** A few distinct example values, used to help the AI pick correct filters. */
  examples: string[];
  profile?: ColumnProfile;
}

export interface TableInfo {
  /** SQL table name, lower snake_case. */
  name: string;
  /** Name of the uploaded file this table came from. */
  fileName: string;
  /** Sheet name for Excel files. */
  sheet?: string;
  rowCount: number;
  columns: ColumnInfo[];
}

/** An uploaded file as stored for the user (one file can yield several tables). */
export interface StoredFile {
  name: string;
  size: number;
  updatedAt: string | null;
}

export interface ResultColumn {
  name: string;
  type: string;
  kind: ColKind;
}

export type CellValue = string | number | null;

export interface QueryResult {
  columns: ResultColumn[];
  rows: Record<string, CellValue>[];
  /** Milliseconds spent running the query in the browser. */
  ms: number;
  /** True when more rows existed than were returned. */
  truncated: boolean;
}

export interface SchemaPayload {
  tables: {
    name: string;
    rowCount: number;
    columns: { name: string; type: string; examples: string[] }[];
  }[];
}
