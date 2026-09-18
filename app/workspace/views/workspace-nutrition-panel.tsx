"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/workspace-ui/alert";
import { Button } from "@/app/components/workspace-ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/workspace-ui/card";
import { Input } from "@/app/components/workspace-ui/input";
import { Label } from "@/app/components/workspace-ui/label";
import { Skeleton } from "@/app/components/workspace-ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/workspace-ui/tabs";
import type { DashboardNutritionPanelProps } from "@/app/dashboard/_components/dashboard-nutrition-panel";
import type { DashboardNutritionData } from "@/app/dashboard/dashboard-types";
import {
  formatWeightWithUnit,
  getWeightUnitLabel,
  type WeightUnit,
} from "@/lib/weight-unit";

// recharts is ~186kb gzipped; keep it out of the workspace entry chunk.
const NutritionCaloriesChart = dynamic(
  () =>
    import("@/app/dashboard/_components/nutrition-charts").then(
      (module) => module.NutritionCaloriesChart,
    ),
  { loading: () => <Skeleton className="size-full" /> },
);
const BodyWeightChart = dynamic(
  () =>
    import("@/app/dashboard/_components/nutrition-charts").then(
      (module) => module.BodyWeightChart,
    ),
  { loading: () => <Skeleton className="size-full" /> },
);

type ChartMode = "day" | "week" | "month";

type NutritionResponse =
  | {
      ok: true;
      nutrition: DashboardNutritionData;
    }
  | {
      ok?: false;
      error?: string;
    };

type HistoryRow = DashboardNutritionData["history"][number];

type RecallOption = {
  key: string;
  label: string;
  calories: number;
  proteinGrams: number;
};

const CHART_MODES: Array<{ value: ChartMode; label: string }> = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value);
}

function formatInputNumber(value: number | null, maximumFractionDigits = 1) {
  if (value === null) {
    return "";
  }

  return `${Number(value.toFixed(maximumFractionDigits))}`;
}

function formatBmrDelta(delta: number | null) {
  if (delta === null) {
    return null;
  }

  if (delta === 0) {
    return "At BMR";
  }

  return `${formatNumber(Math.abs(delta))} ${delta < 0 ? "below" : "above"} BMR`;
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

/**
 * A calorie count is not something anyone can estimate, but a day already
 * logged is an exact number the user produced themselves. These options replay
 * those days into the form so the same total never has to be guessed twice.
 *
 * Ordered by how often a total repeats, then by recency, so a habitual day
 * rises on its own and needs no copy explaining why it is first. The legacy
 * dashboard panel carries the same heuristic for everyone not on the workspace.
 */
function buildRecallOptions(history: DashboardNutritionData["history"]): RecallOption[] {
  // Index 0 is today, which the form below already holds; replaying it is a no-op.
  const logged = history
    .map((row, offset) => ({ row, offset }))
    .slice(1)
    .filter(({ row }) => row.calories > 0 || row.proteinGrams > 0);

  if (logged.length === 0) {
    return [];
  }

  const grouped = new Map<
    string,
    { option: RecallOption; count: number; recency: number }
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
  const loggedCalories = logged.map(({ row }) => row.calories).filter((value) => value > 0);
  const loggedProtein = logged
    .map(({ row }) => row.proteinGrams)
    .filter((value) => value > 0);
  const typical: RecallOption = {
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

/**
 * Today's totals as two sentences. A tile wall would print the same numbers the
 * form below already holds, so the summary only says what the form cannot: how
 * today sits against the BMR target.
 */
function buildTodaySummary(
  nutrition: DashboardNutritionData,
  weightUnit: WeightUnit,
): { headline: string; detail: string } {
  const logged: string[] = [];

  if (nutrition.today.calories > 0) {
    logged.push(`${formatNumber(nutrition.today.calories)} calories`);
  }

  if (nutrition.today.proteinGrams > 0) {
    logged.push(`${formatNumber(nutrition.today.proteinGrams, 1)}g of protein`);
  }

  const headline =
    logged.length > 0
      ? `You logged ${logged.join(" and ")} today.`
      : "Nothing is logged for today yet.";
  const detail: string[] = [];

  if (nutrition.bmrCalories === null) {
    detail.push("You have not set a BMR target.");
  } else if (nutrition.today.calories > 0 && nutrition.today.calorieDeltaFromBmr !== null) {
    const delta = nutrition.today.calorieDeltaFromBmr;
    detail.push(
      delta === 0
        ? `That lands exactly on your ${formatNumber(nutrition.bmrCalories)} calorie BMR.`
        : `That is ${formatNumber(Math.abs(delta))} ${delta < 0 ? "below" : "above"} your ${formatNumber(nutrition.bmrCalories)} calorie BMR.`,
    );
  } else {
    detail.push(`Your BMR target is ${formatNumber(nutrition.bmrCalories)} calories.`);
  }

  if (nutrition.today.bodyWeight !== null) {
    detail.push(
      `You weighed ${formatWeightWithUnit(nutrition.today.bodyWeight, weightUnit, {
        maximumFractionDigits: 1,
      })} today.`,
    );
  }

  return { detail: detail.join(" "), headline };
}

function describeHistoryRow(row: HistoryRow, weightUnit: WeightUnit) {
  const totals: string[] = [];

  if (row.calories > 0) {
    totals.push(`${formatNumber(row.calories)} cal`);
  }

  if (row.proteinGrams > 0) {
    totals.push(`${formatNumber(row.proteinGrams, 1)}g`);
  }

  const context: string[] = [];
  const deltaLabel = row.calories > 0 ? formatBmrDelta(row.calorieDeltaFromBmr) : null;

  if (deltaLabel) {
    context.push(deltaLabel);
  }

  if (row.bodyWeight !== null) {
    context.push(
      formatWeightWithUnit(row.bodyWeight, weightUnit, { maximumFractionDigits: 1 }),
    );
  }

  return {
    context: context.join(" · "),
    totals: totals.length > 0 ? totals.join(" · ") : "Weight only",
  };
}

export function WorkspaceNutritionPanel({
  nutrition,
  weightUnit,
  onNutritionChange,
}: DashboardNutritionPanelProps) {
  const [caloriesInput, setCaloriesInput] = useState(`${nutrition.today.calories || ""}`);
  const [proteinInput, setProteinInput] = useState(
    nutrition.today.proteinGrams > 0 ? formatInputNumber(nutrition.today.proteinGrams) : "",
  );
  const [bmrInput, setBmrInput] = useState(`${nutrition.bmrCalories ?? ""}`);
  const [bodyWeightInput, setBodyWeightInput] = useState(
    formatInputNumber(nutrition.today.bodyWeight),
  );
  const [chartMode, setChartMode] = useState<ChartMode>("day");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeRecallKey, setActiveRecallKey] = useState<string | null>(null);

  const unitLabel = getWeightUnitLabel(weightUnit);
  const summary = buildTodaySummary(nutrition, weightUnit);
  const recallOptions = buildRecallOptions(nutrition.history);
  const historyRows = nutrition.history.filter(
    (row) => row.calories > 0 || row.proteinGrams > 0 || row.bodyWeight !== null,
  );
  const bodyWeightSeries = [...nutrition.history]
    .reverse()
    .filter((row) => row.bodyWeight !== null)
    .map((row) => ({ label: row.label, weight: row.bodyWeight }));

  useEffect(() => {
    setCaloriesInput(`${nutrition.today.calories || ""}`);
    setProteinInput(nutrition.today.proteinGrams > 0 ? formatInputNumber(nutrition.today.proteinGrams) : "");
    setBmrInput(`${nutrition.bmrCalories ?? ""}`);
    setBodyWeightInput(formatInputNumber(nutrition.today.bodyWeight));
    setActiveRecallKey(null);
    setSaveError(null);
  }, [nutrition]);

  async function handleSave() {
    if (isSaving) {
      return;
    }

    const toastId = toast.loading("Saving nutrition...");
    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch("/api/nutrition", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: nutrition.today.dateKey,
          calories: caloriesInput,
          proteinGrams: proteinInput,
          bmrCalories: bmrInput,
          bodyWeight: bodyWeightInput,
        }),
      });
      const payload = (await response.json()) as NutritionResponse;

      if (!response.ok || !payload || !("ok" in payload && payload.ok)) {
        throw new Error(
          payload && "error" in payload ? payload.error : "Unable to save nutrition.",
        );
      }

      onNutritionChange(payload.nutrition);
      posthog.capture("nutrition_targets_updated");
      toast.success("Nutrition saved.", { id: toastId });
    } catch (error) {
      // Typed numbers stay exactly where they are: a failed request must never
      // cost someone the day they just counted.
      const message =
        error instanceof Error ? error.message : "Unable to save nutrition.";
      setSaveError(message);
      toast.error(message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="cn-font-heading text-xl leading-tight font-medium">
          {summary.headline}
        </h1>
        <p className="text-sm text-muted-foreground">{summary.detail}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Today</CardTitle>
          <CardDescription>
            {recallOptions.length > 0
              ? "Reuse a day you already logged, or type what you know. Blank fields stay blank."
              : "Type what you know. Blank fields stay blank."}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {recallOptions.length > 0 ? (
            <div className="flex flex-col" data-nutrition-recall="true">
              {recallOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  data-nutrition-recall-row={option.key}
                  data-active={activeRecallKey === option.key}
                  disabled={isSaving}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-lg border-t border-border px-1 text-left text-sm transition-colors first:border-t-0 hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50 data-[active=true]:bg-muted"
                  onClick={() => {
                    setCaloriesInput(`${option.calories}`);
                    setProteinInput(formatInputNumber(option.proteinGrams));
                    setActiveRecallKey(option.key);
                  }}
                >
                  <span>{option.label}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatNumber(option.calories)} cal ·{" "}
                    {formatNumber(option.proteinGrams, 1)}g
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="workspaceNutritionCalories">Calories</Label>
              <Input
                id="workspaceNutritionCalories"
                inputMode="numeric"
                placeholder="0"
                value={caloriesInput}
                disabled={isSaving}
                onChange={(event) => {
                  setCaloriesInput(event.target.value.replace(/\D/g, ""));
                  setActiveRecallKey(null);
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="workspaceNutritionProtein">Protein (g)</Label>
              <Input
                id="workspaceNutritionProtein"
                inputMode="decimal"
                placeholder="0"
                value={proteinInput}
                disabled={isSaving}
                onChange={(event) => {
                  setProteinInput(event.target.value.replace(/[^0-9.]/g, ""));
                  setActiveRecallKey(null);
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="workspaceNutritionBmr">BMR</Label>
              <Input
                id="workspaceNutritionBmr"
                inputMode="numeric"
                placeholder="Not set"
                value={bmrInput}
                disabled={isSaving}
                onChange={(event) => setBmrInput(event.target.value.replace(/\D/g, ""))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="workspaceNutritionBodyWeight">Weight ({unitLabel})</Label>
              <Input
                id="workspaceNutritionBodyWeight"
                inputMode="decimal"
                placeholder="Not logged"
                value={bodyWeightInput}
                disabled={isSaving}
                onChange={(event) =>
                  setBodyWeightInput(event.target.value.replace(/[^0-9.]/g, ""))
                }
              />
            </div>
          </div>

          {saveError ? (
            <Alert variant="destructive">
              <AlertTitle>Nothing was saved</AlertTitle>
              <AlertDescription>
                {saveError} Your numbers are still here, so you can try again.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="flex">
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={isSaving}
              onClick={() => void handleSave()}
            >
              {isSaving ? "Saving…" : "Save today"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={chartMode} onValueChange={(value) => setChartMode(value as ChartMode)}>
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Calories against your BMR</CardTitle>
              <TabsList variant="card" activeValue={chartMode}>
                {CHART_MODES.map((mode) => (
                  <TabsTrigger key={mode.value} value={mode.value}>
                    {mode.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </CardHeader>

          <CardContent>
            {CHART_MODES.map((mode) => (
              <TabsContent key={mode.value} value={mode.value}>
                {nutrition.chart[mode.value].length > 0 ? (
                  <div className="workspace-chart-theme h-56 w-full sm:h-64">
                    <NutritionCaloriesChart chartRows={nutrition.chart[mode.value]} />
                  </div>
                ) : (
                  <p className="py-8 text-sm text-muted-foreground">
                    Nothing logged in this range yet.
                  </p>
                )}
              </TabsContent>
            ))}
          </CardContent>
        </Card>
      </Tabs>

      {bodyWeightSeries.length >= 2 ? (
        <Card>
          <CardHeader>
            <CardTitle>Body weight</CardTitle>
            <CardDescription>
              Every day you recorded a weight, oldest first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="workspace-chart-theme h-56 w-full sm:h-64">
              <BodyWeightChart
                bodyWeightSeries={bodyWeightSeries}
                weightUnit={weightUnit}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="cn-font-heading text-base font-medium">History</h2>
          <p className="text-sm text-muted-foreground">
            {historyRows.length > 0
              ? `${historyRows.length === 1 ? "One day" : `${historyRows.length} days`} recorded so far.`
              : "Nothing has been logged yet. Today is a fine place to start."}
          </p>
        </div>

        {historyRows.length > 0 ? (
          <div className="flex flex-col">
            {historyRows.map((row) => {
              const described = describeHistoryRow(row, weightUnit);

              return (
                <div
                  key={row.dateKey}
                  className="flex items-start justify-between gap-3 border-t border-border py-2.5 first:border-t-0 first:pt-0"
                >
                  <span className="text-sm">{row.label}</span>
                  <span className="flex flex-col items-end">
                    <span className="text-sm tabular-nums">{described.totals}</span>
                    {described.context ? (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {described.context}
                      </span>
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}
      </section>
    </div>
  );
}
