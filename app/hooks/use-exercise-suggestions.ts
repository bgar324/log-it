"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeExerciseLookupKey } from "@/lib/exercise-autofill";

type ExerciseSuggestionsPayload = {
  suggestions?: string[];
  error?: string;
};

type UseExerciseSuggestionsOptions = {
  debounceMs?: number;
};

function toSuggestionList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item !== "");
}

export function useExerciseSuggestions({
  debounceMs = 140,
}: UseExerciseSuggestionsOptions = {}) {
  const cacheRef = useRef<Record<string, string[]>>({});
  const latestLookupRef = useRef<Record<string, string>>({});
  const debounceTimeoutRef = useRef<Record<string, number>>({});
  const [resultsByKey, setResultsByKey] = useState<Record<string, string[]>>(
    {},
  );

  const setResults = useCallback((entityKey: string, results: string[]) => {
    setResultsByKey((current) => {
      if (results.length === 0) {
        if (!(entityKey in current)) {
          return current;
        }

        const next = { ...current };
        delete next[entityKey];
        return next;
      }

      const previous = current[entityKey] ?? [];

      if (
        previous.length === results.length &&
        previous.every((item, index) => item === results[index])
      ) {
        return current;
      }

      return {
        ...current,
        [entityKey]: results,
      };
    });
  }, []);

  const clearPendingLookup = useCallback((entityKey: string) => {
    const pendingTimeout = debounceTimeoutRef.current[entityKey];

    if (pendingTimeout !== undefined) {
      window.clearTimeout(pendingTimeout);
      delete debounceTimeoutRef.current[entityKey];
    }
  }, []);

  const clearResults = useCallback(
    (entityKey: string) => {
      setResults(entityKey, []);
      delete latestLookupRef.current[entityKey];
    },
    [setResults],
  );

  const fetchSuggestions = useCallback(
    async (entityKey: string, query: string) => {
      const lookupKey = normalizeExerciseLookupKey(query);

      if (!lookupKey) {
        clearResults(entityKey);
        return;
      }

      const cachedSuggestions = cacheRef.current[lookupKey];

      if (cachedSuggestions) {
        setResults(entityKey, cachedSuggestions);
        return;
      }

      latestLookupRef.current[entityKey] = lookupKey;

      try {
        const response = await fetch(
          `/api/workouts/exercise-suggestions?query=${encodeURIComponent(query)}`,
          {
            cache: "no-store",
          },
        );
        const payload = (await response.json()) as ExerciseSuggestionsPayload;

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load suggestions.");
        }

        const suggestions = toSuggestionList(payload.suggestions);
        cacheRef.current[lookupKey] = suggestions;

        if (latestLookupRef.current[entityKey] !== lookupKey) {
          return;
        }

        setResults(entityKey, suggestions);
      } catch {
        if (latestLookupRef.current[entityKey] !== lookupKey) {
          return;
        }

        setResults(entityKey, []);
      }
    },
    [clearResults, setResults],
  );

  const queueLookup = useCallback(
    (entityKey: string, rawValue: string) => {
      clearPendingLookup(entityKey);

      if (!rawValue.trim()) {
        clearResults(entityKey);
        return;
      }

      debounceTimeoutRef.current[entityKey] = window.setTimeout(() => {
        delete debounceTimeoutRef.current[entityKey];
        void fetchSuggestions(entityKey, rawValue);
      }, debounceMs);
    },
    [clearPendingLookup, clearResults, debounceMs, fetchSuggestions],
  );

  const clearAll = useCallback(() => {
    for (const entityKey of Object.keys(debounceTimeoutRef.current)) {
      clearPendingLookup(entityKey);
    }

    latestLookupRef.current = {};
    setResultsByKey({});
  }, [clearPendingLookup]);

  useEffect(() => {
    const pendingTimeouts = debounceTimeoutRef.current;

    return () => {
      for (const timeoutId of Object.values(pendingTimeouts)) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return {
    resultsByKey,
    clearAll,
    clearPendingLookup,
    clearResults,
    fetchSuggestions,
    queueLookup,
    setResults,
  };
}
