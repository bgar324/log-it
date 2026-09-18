import type { DashboardNutritionData } from "@/app/dashboard/dashboard-types";

export type IonicRecallOption = {
  key: string;
  label: string;
  calories: number;
  proteinGrams: number;
};

/**
 * A calorie count is not something anyone can estimate, but a day already
 * logged is an exact number the user produced themselves. These options replay
 * those days into the form so the same total never has to be guessed twice.
 *
 * Ordered by how often a total repeats, then by recency, so a habitual day
 * rises on its own and needs no copy explaining why it is first.
 *
 * The legacy dashboard panel carries the same heuristic; the two are kept
 * separate because the old panel still serves everyone not on the Ionic app.
 */
export function buildIonicRecallOptions(
  history: DashboardNutritionData["history"],
): IonicRecallOption[] {
  // Index 0 is today, which the form already holds; replaying it is a no-op.
  const logged = history
    .map((row, offset) => ({ row, offset }))
    .slice(1)
    .filter(({ row }) => row.calories > 0 || row.proteinGrams > 0);

  if (logged.length === 0) {
    return [];
  }

  const grouped = new Map<
    string,
    { option: IonicRecallOption; count: number; recency: number }
  >();

  for (const { row, offset } of logged) {
    const key = `${row.calories}|${row.proteinGrams}`;
    const existing = grouped.get(key);

    if (existing) {
      existing.count += 1;
      continue;
    }

    grouped.set(key, {
      option: {
        key,
        label: offset === 1 ? "Same as yesterday" : `Same as ${row.label}`,
        calories: row.calories,
        proteinGrams: row.proteinGrams,
      },
      count: 1,
      recency: offset,
    });
  }

  const options = [...grouped.values()]
    .sort((left, right) => right.count - left.count || left.recency - right.recency)
    .slice(0, 3)
    .map((entry) => entry.option);

  if (logged.length < 3) {
    return options;
  }

  // Nothing in the list fits today? The user's own middle day beats a guess.
  const loggedCalories = logged
    .map(({ row }) => row.calories)
    .filter((value) => value > 0)
    .sort((left, right) => left - right);
  const loggedProtein = logged
    .map(({ row }) => row.proteinGrams)
    .filter((value) => value > 0)
    .sort((left, right) => left - right);
  const typical: IonicRecallOption = {
    key: "typical",
    label: "A typical day for you",
    calories: loggedCalories.length > 0 ? Math.round(median(loggedCalories)) : 0,
    proteinGrams:
      loggedProtein.length > 0 ? Math.round(median(loggedProtein) * 10) / 10 : 0,
  };

  const alreadyOffered = options.some(
    (option) =>
      option.calories === typical.calories &&
      option.proteinGrams === typical.proteinGrams,
  );

  return alreadyOffered ? options : [typical, ...options];
}

// Even sample sizes average the two middle values, so the "typical" day is not
// biased toward whichever neighbour happens to sort first.
function median(sorted: number[]) {
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}
