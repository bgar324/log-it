"use client";

import { useEffect, useState } from "react";

export function useIonicResource<T>(url: string, active: boolean, revision: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    async function load() {
      try {
        const response = await fetch(url, { cache: "no-store", signal: controller.signal });
        if (response.status === 401) { window.location.replace("/auth?mode=signin"); return; }
        if (response.status === 403) { window.location.replace("/dashboard"); return; }
        if (!response.ok) throw new Error(response.status === 404 ? "This item could not be found." : "Unable to load this screen.");
        const payload: { data?: T } = await response.json();
        if (!payload.data) throw new Error("The response was incomplete. Try again.");
        if (!controller.signal.aborted) setData(payload.data);
      } catch (caught) {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Unable to load this screen.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [url, active, revision, retry]);
  return { data, error, loading, retry: () => setRetry(value => value + 1) };
}
