import { useCallback, useEffect, useRef, useState } from "react";

export type Resource<T> = {
  /** `undefined` while the first request is still in flight. */
  data: T | undefined;
  error: Error | null;
  loading: boolean;
  reload: () => void;
};

/**
 * Minimal data-fetching hook for the REST API.
 *
 * CareerPilot's API is request/response rather than live-subscription based, so
 * each screen re-fetches explicitly after a mutation with `reload()`. A request
 * counter guards against an older response overwriting a newer one.
 */
export function useResource<T>(loader: () => Promise<T>, deps: unknown[] = []): Resource<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    loaderRef
      .current()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause : new Error(String(cause)));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return { data, error, loading, reload };
}
