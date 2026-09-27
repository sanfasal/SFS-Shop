"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "@/lib/api-error";

// Loads data from the API and exposes loading/error state plus a reload.
// `load` must be memoized (useCallback) so it only refetches when its inputs change.
export function useApiData<T>(load: () => Promise<T>, fallbackError: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await load());
    } catch (err) {
      setError(errorMessage(err, fallbackError));
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
