import type { DuckLike } from "./duckTypes";
import type { ArrowTableLike } from "./arrowConvert";

let ready: Promise<DuckLike> | null = null;

/** Starts DuckDB-WASM once, in a web worker. The ~30 MB engine is only fetched when first needed. */
export function getDuck(): Promise<DuckLike> {
  if (!ready) {
    ready = (async () => {
      const duckdb = await import("@duckdb/duckdb-wasm");
      const [{ default: wasmUrl }, { default: workerUrl }] = await Promise.all([
        import("@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url"),
        import("@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url"),
      ]);
      const worker = new Worker(workerUrl);
      const db = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker);
      await db.instantiate(wasmUrl);
      const conn = await db.connect();
      return {
        query: (sql: string) => conn.query(sql) as unknown as Promise<ArrowTableLike>,
        tableNames: (sql: string) => conn.getTableNames(sql),
        registerText: async (name: string, text: string) => { await db.registerFileText(name, text); },
        dropFile: async (name: string) => { await db.dropFile(name); },
      } satisfies DuckLike;
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready as Promise<DuckLike>;
}
