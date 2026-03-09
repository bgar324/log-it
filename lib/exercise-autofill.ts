const COMMON_WORD_FIXES: Record<string, string> = {
  dumbell: "dumbbell",
  barbel: "barbell",
  barbelll: "barbell",
  pulldwon: "pulldown",
  shoudler: "shoulder",
  deltiod: "deltoid",
  tricep: "triceps",
  bicep: "biceps",
};

function toSafeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function normalizeExerciseDisplayName(value: unknown) {
  const trimmed = toSafeString(value).trim().replace(/\s+/g, " ");

  if (!trimmed) {
    return "";
  }

  return trimmed
    .split(" ")
    .map((word) => {
      const lower = word.toLowerCase();
      const fixed = COMMON_WORD_FIXES[lower] ?? lower;
      return fixed.charAt(0).toUpperCase() + fixed.slice(1);
    })
    .join(" ");
}

export function normalizeExerciseLookupKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function scoreExerciseSuggestionMatch(queryKey: string, candidateKey: string) {
  if (!queryKey || queryKey === candidateKey) {
    return Number.NEGATIVE_INFINITY;
  }

  const queryTokens = queryKey.split(" ").filter(Boolean);

  if (
    queryTokens.length === 0 ||
    queryTokens.some((token) => !candidateKey.includes(token))
  ) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = 0;

  if (candidateKey.startsWith(queryKey)) {
    score += 280;
  } else if (candidateKey.includes(queryKey)) {
    score += 190;
  }

  for (const token of queryTokens) {
    const tokenIndex = candidateKey.indexOf(token);

    if (tokenIndex === -1) {
      continue;
    }

    const startsWord = tokenIndex === 0 || candidateKey[tokenIndex - 1] === " ";
    score += startsWord ? 45 : 22;
  }

  const lengthPenalty = Math.max(0, candidateKey.length - queryKey.length);
  score -= lengthPenalty * 0.5;

  return score;
}

export function pickBestExerciseSuggestion(rawQuery: string, suggestions: string[]) {
  const lookupKey = normalizeExerciseLookupKey(rawQuery);

  if (!lookupKey) {
    return null;
  }

  let bestName: string | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const suggestion of suggestions) {
    const candidateName = suggestion.trim().replace(/\s+/g, " ");

    if (!candidateName) {
      continue;
    }

    const candidateKey = normalizeExerciseLookupKey(candidateName);
    const score = scoreExerciseSuggestionMatch(lookupKey, candidateKey);

    if (!Number.isFinite(score)) {
      continue;
    }

    if (
      score > bestScore ||
      (score === bestScore &&
        bestName !== null &&
        candidateName.length < bestName.length)
    ) {
      bestName = candidateName;
      bestScore = score;
    }
  }

  return bestName;
}
