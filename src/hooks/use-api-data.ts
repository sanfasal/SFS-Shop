"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "@/lib/api-error";

// Loads data from the API and exposes loading/error state plus a reload.
// `load` must be memoized (useCallback) so it only refetches when its inputs change.
export function useApiData<T>(load: () => Promise<T>, fallbackError: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolves with the fresh data (null on failure) for callers that need it right away.
  const reload = useCallback(async (): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const value = await load();
      setData(value);
      return value;
    } catch (err) {
      setError(errorMessage(err, fallbackError));
      return null;
    } finally {
      setLoading(false);
    }
  }, [load, fallbackError]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching effect; state updates happen after the request resolves
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}
