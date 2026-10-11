import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api/http";

interface ApiState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
}

export function useApi<T>(
  fetcher: () => Promise<T>,
): ApiState<T> & { reload: () => void } {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    error: null,
    loading: true,
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) {
        return;
      }
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const data = await fetcher();
        if (!cancelled) {
          setState({ data, error: null, loading: false });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            data: null,
            error:
              err instanceof ApiError ? err : new ApiError(0, "Request failed"),
            loading: false,
          });
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [fetcher, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { ...state, reload };
}