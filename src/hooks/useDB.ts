import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { isDemoEmail } from "@/config";
import { loadDB, type DB } from "@/data/seed";

/** Loads generated demo data only for its designated signed-in account. */
export function useDB() {
  const { user } = useAuth();
  const isDemoAccount = isDemoEmail(user?.email);
  const [db, setDb] = useState<DB | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isDemoAccount) {
      setDb(null);
      setLoading(false);
      setError(null);
      return;
    }

    let live = true;
    setLoading(true);
    setError(null);
    loadDB()
      .then((data) => {
        if (live) setDb(data);
      })
      .catch((reason: unknown) => {
        if (live) setError(reason instanceof Error ? reason.message : "Could not load demo analytics.");
      })
      .finally(() => {
        if (live) setLoading(false);
      });

    return () => {
      live = false;
    };
  }, [isDemoAccount, user?.id]);

  return { db, loading, error, isDemoAccount };
}
