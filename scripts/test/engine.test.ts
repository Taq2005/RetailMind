// Run: npx tsx scripts/test/engine.test.ts
import { createRequire } from "node:module";
import type { DuckLike } from "../../src/data/workspace/duckTypes";
import { ingestCsv, ingestExcelSheets, decodeText } from "../../src/data/workspace/ingest";
import { runUserQuery } from "../../src/data/workspace/engine";
import { guardSql } from "../../src/data/workspace/sqlGuard";

const require = createRequire(import.meta.url);
const P = process.cwd() + "/node_modules/@duckdb/duckdb-wasm/dist/";
const duckdb = require(P + "duckdb-node-blocking.cjs");

let pass = 0, fail = 0;
const ok = (c: unknown, m: string) => { if (c) pass++; else { fail++; console.log("FAIL", m); } };

(async () => {
  const bundles = { mvp: { mainModule: P + "duckdb-mvp.wasm", mainWorker: P + "duckdb-node-mvp.worker.cjs" }, eh: { mainModule: P + "duckdb-eh.wasm", mainWorker: P + "duckdb-node-eh.worker.cjs" } };
  const d = await duckdb.createDuckDB(bundles, new duckdb.VoidLogger(), duckdb.NODE_RUNTIME);
  await d.instantiate(() => {});
  const conn = d.connect();
  const db: DuckLike = {
    query: async (s) => conn.query(s),
    tableNames: async (s) => conn.getTableNames(s),
    registerText: async (n, t) => { d.registerFileText(n, t); },
    dropFile: async (n) => { d.dropFile(n); },
  };

  // guard
  ok(guardSql("select 1").ok, "select ok");
  ok(guardSql("WITH a AS (SELECT 1) SELECT * FROM a;").ok, "with ok");
  ok(!guardSql("DROP TABLE x").ok, "drop blocked");
  ok(!guardSql("select 1; select 2").ok, "multi blocked");
  ok(!guardSql("select * from read_csv('x')").ok, "read_csv blocked");
  ok(!guardSql("select 1 -- ; drop\n; delete from t").ok, "delete after comment blocked");
  ok(guardSql("select 'drop table; x' as s").ok, "keyword in string ok");
  ok(guardSql('select "update" from t').ok, "quoted ident ok");
  ok(!guardSql("select * from t; attach 'x'").ok, "attach blocked");
  ok(!guardSql("copy t to 'x.csv'").ok, "copy blocked");

  // csv with messy data
  const csv = 'Order ID,Order Date,Customer Name,Amount (PKR),Qty,Status,Phone,Paid\n1,2026-01-05,Ali,"1,200.50",2,Completed,0300123,true\n2,2026-01-06,Sana,900,1,Returned,0311999,false\n3,2026-02-01,Bilal,"2,500",3,Completed,,true\n';
  const t = await ingestCsv(db, { fileName: "Sales Q1 (2026).csv", csv }, []);
  console.log(t.name, t.rowCount, t.columns.map((c) => `${c.name}:${c.type}`).join(" "));
  ok(t.name === "sales_q1_2026", "table name");
  ok(t.rowCount === 3, "rows");
  const typ = Object.fromEntries(t.columns.map((c) => [c.name, c.type]));
  ok(typ.order_id === "BIGINT" && typ.order_date === "DATE" && typ.amount_pkr === "DOUBLE" && typ.phone === "VARCHAR" && typ.paid === "BOOLEAN" && typ.status === "VARCHAR", "types " + JSON.stringify(typ));

  const r = await runUserQuery(db, "SELECT status, sum(amount_pkr) AS revenue, count(*) AS n, date_trunc('month', max(order_date)) AS m FROM sales_q1_2026 GROUP BY 1 ORDER BY 2 DESC", [t]);
  console.log(JSON.stringify(r.result.rows), r.result.columns.map((c) => c.kind));
  ok(r.result.rows[0].revenue === 3700.5 || r.result.rows[0].revenue === 3700.5, "sum");
  ok(r.result.rows[0].n === 3 || r.result.rows[0].n === 2, "count number");

  // decimals / bigint / avg
  const r2 = await runUserQuery(db, "SELECT CAST(amount_pkr AS DECIMAL(12,2)) AS dec, order_date, CAST(order_date AS TIMESTAMP) AS ts, sum(qty) OVER () AS s FROM sales_q1_2026 ORDER BY 1", [t]);
  console.log(JSON.stringify(r2.result.rows[0]));
  ok(r2.result.rows[0].dec === 900 && r2.result.rows[0].order_date === "2026-01-06" && r2.result.rows[0].ts === "2026-01-06 00:00:00" && r2.result.rows[0].s === 6, "convert");

  const semi = await ingestCsv(db, { fileName: "semi.csv", csv: "a;b\n1;x y\n2;z\n" }, [t.name]);
  ok(semi.columns.length === 2 && semi.rowCount === 2, "semicolon");
  const tab = await ingestCsv(db, { fileName: "tabby.csv", csv: "a\tb\n1\tx\n" }, [t.name]);
  ok(tab.columns.length === 2, "tab");
  // allowlist & errors
  for (const bad of ["SELECT * FROM information_schema.tables", "SELECT * FROM nope", "SELECT * FROM duckdb_tables()", "SELECT * FROM sales_q1_2026; DROP TABLE sales_q1_2026"]) {
    let rejected = false; try { await runUserQuery(db, bad, [t]); } catch { rejected = true; }
    ok(rejected, "rejected: " + bad);
  }
  let msg = ""; try { await runUserQuery(db, "SELECT nocol FROM sales_q1_2026", [t]); } catch (e) { msg = (e as Error).message; }
  ok(msg.length > 0, "binder error surfaced: " + msg);

  // limit
  const big = await runUserQuery(db, "SELECT i FROM range(0, 5000) t(i)", [{ ...t, name: "range" } as never]).catch((e) => e);
  console.log("range", big instanceof Error ? big.message : big.result.rows.length);

  // dd/mm/yyyy dates, cp1252, excel
  const t2 = await ingestCsv(db, { fileName: "d.csv", csv: "Date,Val\n15/01/2026,1\n02/03/2026,2\n" }, [t.name]);
  ok(t2.columns[0].type === "DATE", "dmy date " + t2.columns[0].type);
  const r3 = await runUserQuery(db, "SELECT min(date) AS a, max(date) AS b FROM d", [t, t2]);
  ok(r3.result.rows[0].a === "2026-01-15" && r3.result.rows[0].b === "2026-03-02", "dmy values " + JSON.stringify(r3.result.rows));
  ok(decodeText(new Uint8Array([0x43, 0x61, 0x66, 0xe9])) === "Café", "cp1252");
  const xs = await ingestExcelSheets(db, "book.xlsx", [
    { sheet: "Orders", data: [["Id", "Day", "Total"], [1, new Date("2026-01-05T00:00:00Z"), 10.5], [2, new Date("2026-01-06T00:00:00Z"), 20]] },
    { sheet: "Empty", data: [] },
    { sheet: "Items", data: [[], ["SKU", "Name"], ["A1", "Shirt, red"], ["B2", 'He said "hi"']] },
  ], [t.name, t2.name]);
  console.log(JSON.stringify((await runUserQuery(db, "SELECT * FROM book_items ORDER BY 1", xs)).result.rows)); console.log(xs.map((x) => `${x.name}(${x.rowCount}) ${x.columns.map((c) => c.type).join(",")}`));
  ok(xs.length === 2 && xs[0].columns[1].type === "DATE", "excel sheets");
  const r4 = await runUserQuery(db, "SELECT name FROM book_items ORDER BY sku", xs);
  ok(r4.result.rows[1].name === 'He said "hi"', "csv escaping");

  console.log(`pass ${pass} fail ${fail}`);
  process.exit(fail ? 1 : 0);
})();
