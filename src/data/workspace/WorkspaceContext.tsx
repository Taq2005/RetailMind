import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/auth/AuthContext";
import { isDemoEmail } from "@/config";
import { getDuck } from "./duck";
import type { DuckLike } from "./duckTypes";
import { qi } from "./names";
import { checkFile, ingestFileBytes } from "./files";
import { downloadFile, listFiles, removeStoredFile, safeObjectName, uploadFile } from "./storage";
import type { StoredFile, TableInfo } from "./types";

type Status = "idle" | "loading" | "ready" | "error";

export interface UploadOutcome { fileName: string; ok: boolean; message?: string; tables?: string[] }

interface Workspace {
  /** True for accounts that use the uploaded-data workspace (everyone except the sample demo account). */
  enabled: boolean;
  status: Status;
  error: string | null;
  tables: TableInfo[];
  files: StoredFile[];
  busy: boolean;
  /** Names of files currently being processed. */
  processing: string[];
  db: DuckLike | null;
  addFiles: (files: File[]) => Promise<UploadOutcome[]>;
  removeFile: (name: string) => Promise<void>;
  reload: () => Promise<void>;
}

const Ctx = createContext<Workspace | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const enabled = !!user && !isDemoEmail(user.email);
  const userId = user?.id ?? null;

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [processing, setProcessing] = useState<string[]>([]);
  const [db, setDb] = useState<DuckLike | null>(null);
  const tablesRef = useRef<TableInfo[]>([]);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const setAllTables = (t: TableInfo[]) => {
    tablesRef.current = t;
    setTables(t);
  };

  /** Serialise work on the single DuckDB connection. */
  const enqueue = useCallback(<T,>(job: () => Promise<T>): Promise<T> => {
    const run = queue.current.then(job, job);
    queue.current = run.catch(() => undefined);
    return run;
  }, []);

  const dropTablesOf = useCallback(async (duck: DuckLike, fileName: string) => {
    const mine = tablesRef.current.filter((t) => t.fileName === fileName);
    for (const t of mine) await duck.query(`DROP TABLE IF EXISTS ${qi(t.name)}`);
    setAllTables(tablesRef.current.filter((t) => t.fileName !== fileName));
  }, []);

  const loadSeq = useRef(0);

  const load = useCallback(async () => {
    if (!enabled || !userId) return;
    const seq = ++loadSeq.current;
    const current = () => seq === loadSeq.current;
    setStatus("loading");
    setError(null);
    try {
      // Only start the (large) query engine when there is something to load.
      const stored = await listFiles(userId);
      if (!current()) return;
      setFiles(stored);
      if (!stored.length) {
        setStatus("ready");
        return;
      }
      const duck = await getDuck();
      if (!current()) return;
      setDb(duck);
      const failed: string[] = [];
      await enqueue(async () => {
        if (!current()) return; // a newer load superseded this one (React StrictMode, quick re-login)
        for (const t of tablesRef.current) await duck.query(`DROP TABLE IF EXISTS ${qi(t.name)}`);
        setAllTables([]);
        for (const f of stored) {
          if (!current()) return;
          try {
            const bytes = await downloadFile(userId, f.name);
            const t = await ingestFileBytes(duck, f.name, bytes, tablesRef.current.map((x) => x.name));
            setAllTables([...tablesRef.current, ...t]);
          } catch (e) {
            failed.push(`${f.name}: ${e instanceof Error ? e.message : "failed to load"}`);
          }
        }
      });
      if (!current()) return;
      setStatus("ready");
      if (failed.length) setError(failed.join(" "));
    } catch (e) {
      if (!current()) return;
      setStatus("error");
      setError(e instanceof Error ? e.message : "Could not load your data.");
    }
  }, [enabled, userId, enqueue]);

  useEffect(() => {
    setAllTables([]);
    setFiles([]);
    setDb(null);
    setError(null);
    setStatus("idle");
    if (enabled) void load();
  }, [enabled, userId, load]);

  const addFiles = useCallback(
    async (picked: File[]): Promise<UploadOutcome[]> => {
      if (!enabled || !userId) return [];
      const outcomes: UploadOutcome[] = [];
      for (const file of picked) {
        const bad = checkFile(file.name, file.size);
        if (bad) { outcomes.push({ fileName: file.name, ok: false, message: bad }); continue; }
        setProcessing((p) => [...p, file.name]);
        try {
          const bytes = await file.arrayBuffer();
          const duck = await getDuck();
          setDb(duck);
          const created = await enqueue(async () => {
            const storedName = safeObjectName(file.name);
            await dropTablesOf(duck, storedName);
            const others = tablesRef.current.map((t) => t.name);
            const t = await ingestFileBytes(duck, storedName, bytes, others);
            setAllTables([...tablesRef.current, ...t]);
            return t;
          });
          let saveNote: string | undefined;
          try {
            await uploadFile(userId, file);
            setFiles(await listFiles(userId));
          } catch (e) {
            saveNote = `Loaded, but could not be saved to your account (${e instanceof Error ? e.message : "storage error"}). It will be gone after a refresh.`;
          }
          outcomes.push({ fileName: file.name, ok: true, message: saveNote, tables: created.map((t) => t.name) });
        } catch (e) {
          outcomes.push({ fileName: file.name, ok: false, message: e instanceof Error ? e.message : "Could not read this file." });
        } finally {
          setProcessing((p) => p.filter((n) => n !== file.name));
        }
      }
      setStatus("ready");
      return outcomes;
    },
    [enabled, userId, enqueue, dropTablesOf],
  );

  const removeFile = useCallback(
    async (name: string) => {
      if (!userId) return;
      const duck = await getDuck();
      await enqueue(() => dropTablesOf(duck, name));
      try { await removeStoredFile(userId, name); } catch { /* keep UI consistent even if storage fails */ }
      setFiles((f) => f.filter((x) => x.name !== name));
    },
    [userId, enqueue, dropTablesOf],
  );

  const value = useMemo<Workspace>(
    () => ({ enabled, status, error, tables, files, busy: processing.length > 0 || status === "loading", processing, db, addFiles, removeFile, reload: load }),
    [enabled, status, error, tables, files, processing, db, addFiles, removeFile, load],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkspace(): Workspace {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return v;
}
