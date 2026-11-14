import { useEffect, useState } from "react";
import { loadDB, peekDB, type DB } from "@/data/seed";

/** Returns the seeded database, or null for the first paint while it generates. */
export function useDB(): DB | null {
  const [db, setDb] = useState<DB | null>(() => peekDB());
  useEffect(() => {
    if (db) return;
    let live = true;
    loadDB().then((d) => live && setDb(d));
    return () => {
      live = false;
    };
  }, [db]);
  return db;
}
