"use client";

import dynamic from "next/dynamic";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  formatWeightWithUnit,
  getWeightUnitLabel,
  type WeightUnit,
} from "@/lib/weight-unit";

// recharts is ~186kb gzipped; keep it out of the dashboard entry chunk.
const NutritionCaloriesChart = dynamic(
  () => import("./nutrition-charts").then((module) => module.NutritionCaloriesChart),
);
const BodyWeightChart = dynamic(
  () => import("./nutrition-charts").then((module) => module.BodyWeightChart),
);
import { styles } from "../dashboard.styles";
import type { DashboardNutritionData } from "../dashboard-types";
import { DashboardMetricHeader } from "./dashboard-metric-header";

type NutritionData = DashboardNutritionData;
type ChartMode = "day" | "week" | "month";

type NutritionResponse =
  | {
      ok: true;
      nutrition: NutritionData;
    }
  | {
      ok?: false;
      error?: string;
    };

type DashboardNutritionPanelProps = {
  nutrition: NutritionData;
  weightUnit: WeightUnit;
  onNutritionChange: (nutrition: NutritionData) => void;
};

function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}

function formatInputNumber(value: number | null, maximumFractionDigits = 1) {
  if (value === null) {
    return "";
  }

  return `${Number(value.toFixed(maximumFractionDigits))}`;
}

function formatBmrDelta(delta: number | null) {
  if (delta === null) {
    return "No BMR";
  }

  if (delta === 0) {
    return "At BMR";
  }

  return `${Math.abs(delta)} ${delta < 0 ? "below" : "above"}`;
}

type RecallOption = {
  key: string;
  label: string;
  calories: number;
  proteinGrams: number;
};

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
 * rises on its own and needs no copy explaining why it is first.
 */
function buildRecallOptions(history: NutritionData["history"]): RecallOption[] {
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
  const loggedProtein = logged.map(({ row }) => row.proteinGrams).filter((value) => value > 0);
  const typical: RecallOption = {
    key: "typical",
    label: "A typical day for you",
    calories: loggedCalories.length > 0 ? Math.round(median(loggedCalories)) : 0,
    proteinGrams:
      loggedProtein.length > 0 ? Math.round(median(loggedProtein) * 10) / 10 : 0,
  };

  const alreadyOffered = options.some(
    (option) =>
      option.calories === typical.calories && option.proteinGrams === typical.proteinGrams,
  );

  return alreadyOffered ? options : [typical, ...options];
}

export function DashboardNutritionPanel({
  nutrition,
  weightUnit,
  onNutritionChange,
}: DashboardNutritionPanelProps) {
  const [caloriesInput, setCaloriesInput] = useState(`${nutrition.today.calories || ""}`);
  const [proteinInput, setProteinInput] = useState(
    formatInputNumber(nutrition.today.proteinGrams),
  );
  const [bmrInput, setBmrInput] = useState(`${nutrition.bmrCalories ?? ""}`);
  const [bodyWeightInput, setBodyWeightInput] = useState(
    formatInputNumber(nutrition.today.bodyWeight),
  );
  const [chartMode, setChartMode] = useState<ChartMode>("day");
  const [isSaving, setIsSaving] = useState(false);
  const [activeRecallKey, setActiveRecallKey] = useState<string | null>(null);
  const unitLabel = getWeightUnitLabel(weightUnit);
  const chartRows = nutrition.chart[chartMode];
  const historyRows = nutrition.history.filter(
    (row) => row.calories > 0 || row.proteinGrams > 0 || row.bodyWeight !== null,
  );
  const recallOptions = buildRecallOptions(nutrition.history);
  const bodyWeightSeries = [...nutrition.history]
    .reverse()
    .filter((row) => row.bodyWeight !== null)
    .map((row) => ({ label: row.label, weight: row.bodyWeight }));

  function formatHistoryWeight(value: number | null) {
    return value === null
      ? "--"
      : formatWeightWithUnit(value, weightUnit, { maximumFractionDigits: 1 });
  }

  useEffect(() => {
    setCaloriesInput(`${nutrition.today.calories || ""}`);
    setProteinInput(formatInputNumber(nutrition.today.proteinGrams));
    setBmrInput(`${nutrition.bmrCalories ?? ""}`);
    setBodyWeightInput(formatInputNumber(nutrition.today.bodyWeight));
    setActiveRecallKey(null);
  }, [nutrition]);

  function applyRecall(option: RecallOption) {
    setCaloriesInput(`${option.calories}`);
    setProteinInput(formatInputNumber(option.proteinGrams));
    setActiveRecallKey(option.key);
  }

  async function handleSave() {
    if (isSaving) {
      return;
    }

    const toastId = toast.loading("Saving nutrition...");
    setIsSaving(true);

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
      toast.success("Nutrition saved.", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save nutrition.", {
        id: toastId,
      });
    } finally {
      setIsSaving(false);
    }
  }

  const bmrMeta =
    nutrition.bmrCalories === null
      ? "Set target"
      : formatBmrDelta(nutrition.today.calorieDeltaFromBmr);
  const bodyWeightValue =
    nutrition.today.bodyWeight === null
      ? "--"
      : formatWeightWithUnit(nutrition.today.bodyWeight, weightUnit, {
          maximumFractionDigits: 1,
        });

  return (
    <>
      {/* Today's numbers are the form values below; a tile wall would print them twice. */}
      <section>
        <p className={styles.statLine}>
          {formatNumber(nutrition.today.calories)} cal ·{" "}
          {formatNumber(nutrition.today.proteinGrams, 1)}g protein
        </p>
        <p className={styles.statLineMuted}>
          {nutrition.bmrCalories === null
            ? "No BMR target set"
            : `${formatNumber(nutrition.bmrCalories)} cal target · ${bmrMeta}`}
          {nutrition.today.bodyWeight === null ? "" : ` · ${bodyWeightValue} today`}
        </p>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h2 className={styles.panelTitle}>Today</h2>
            <p className={styles.panelSubtitle}>
              {recallOptions.length > 0
                ? "Reuse a day you already logged, or type what you know."
                : "Type what you know. Blank fields stay blank."}
            </p>
          </div>
        </div>

        {recallOptions.length > 0 ? (
          <div className={styles.nutritionRecall} data-nutrition-recall="true">
            {recallOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                className={styles.nutritionRecallRow}
                data-nutrition-recall-row={option.key}
                data-active={activeRecallKey === option.key}
                onClick={() => applyRecall(option)}
              >
                <span className={styles.nutritionRecallLabel}>{option.label}</span>
                <span className={styles.nutritionRecallStat}>
                  {formatNumber(option.calories)} cal · {formatNumber(option.proteinGrams, 1)}g
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <div className={styles.nutritionForm}>
          <label className={styles.nutritionField}>
            Calories
            <input
              className={styles.nutritionInput}
              inputMode="numeric"
              value={caloriesInput}
              onChange={(event) => {
                setCaloriesInput(event.target.value.replace(/\D/g, ""));
                setActiveRecallKey(null);
              }}
            />
          </label>
          <label className={styles.nutritionField}>
            Protein (g)
            <input
              className={styles.nutritionInput}
              inputMode="decimal"
              value={proteinInput}
              onChange={(event) => {
                setProteinInput(event.target.value.replace(/[^0-9.]/g, ""));
                setActiveRecallKey(null);
              }}
            />
          </label>
          <label className={styles.nutritionField}>
            BMR
            <input
              className={styles.nutritionInput}
              inputMode="numeric"
              value={bmrInput}
              onChange={(event) => setBmrInput(event.target.value.replace(/\D/g, ""))}
            />
          </label>
          <label className={styles.nutritionField}>
            Weight ({unitLabel})
            <input
              className={styles.nutritionInput}
              inputMode="decimal"
              value={bodyWeightInput}
              onChange={(event) => setBodyWeightInput(event.target.value.replace(/[^0-9.]/g, ""))}
            />
          </label>
        </div>

        <div className={styles.nutritionFormActions}>
          <button
            type="button"
            className={styles.nutritionSaveButton}
            disabled={isSaving}
            onClick={handleSave}
          >
            {isSaving ? (
              <Loader2 className={`${styles.nutritionButtonIcon} animate-spin`} />
            ) : (
              <Save className={styles.nutritionButtonIcon} />
            )}
            Save
          </button>
        </div>
      </section>

      <section className={styles.chartPanel}>
        <div className={styles.nutritionChartHead}>
          <h2 className={styles.panelTitle}>Calories vs BMR</h2>
          <div className={styles.nutritionSegments}>
            {(["day", "week", "month"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={styles.nutritionSegmentButton}
                data-active={chartMode === mode}
                onClick={() => setChartMode(mode)}
              >
                {mode === "day" ? "Day" : mode === "week" ? "Week" : "Month"}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.nutritionChartFrame}>
          <NutritionCaloriesChart chartRows={chartRows} />
        </div>
      </section>

      {bodyWeightSeries.length >= 2 ? (
        <section className={styles.chartPanel}>
          <div className={styles.nutritionChartHead}>
            <h2 className={styles.panelTitle}>Body weight</h2>
          </div>
          <div className={styles.nutritionChartFrame}>
            <BodyWeightChart
              bodyWeightSeries={bodyWeightSeries}
              weightUnit={weightUnit}
            />
          </div>
        </section>
      ) : null}

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>History</h2>
        </div>
        {historyRows.length > 0 ? (
          <div className={styles.metricList}>
            <DashboardMetricHeader
              columns={["Date", "Calories", "Protein", "BMR Δ", "Weight"]}
              rowClassName={styles.nutritionRow}
            />
            {historyRows.map((row) => (
              <div
                key={row.dateKey}
                className={`${styles.metricRow} ${styles.nutritionRow}`}
              >
                <span className={styles.metricMobileLabel} data-label="Date">
                  {row.label}
                </span>
                <span
                  className={`${styles.metricMobileLabel} ${styles.nutritionDesktopStat}`}
                  data-label="Calories"
                >
                  {formatNumber(row.calories)} cal
                </span>
                <span
                  className={`${styles.metricMobileLabel} ${styles.nutritionDesktopStat}`}
                  data-label="Protein"
                >
                  {formatNumber(row.proteinGrams, 1)}g
                </span>
                <span
                  className={`${styles.metricMobileLabel} ${styles.nutritionDesktopStat}`}
                  data-label="BMR delta"
                >
                  {formatBmrDelta(row.calorieDeltaFromBmr)}
                </span>
                <span
                  className={`${styles.metricMobileLabel} ${styles.nutritionDesktopStat}`}
                  data-label="Weight"
                >
                  {formatHistoryWeight(row.bodyWeight)}
                </span>
                <span className={styles.nutritionMobileStats}>
                  <span className={styles.nutritionMobileStatPrimary}>
                    {formatNumber(row.calories)} cal · {formatNumber(row.proteinGrams, 1)}g
                  </span>
                  <span className={styles.nutritionMobileStatSecondary}>
                    {formatBmrDelta(row.calorieDeltaFromBmr)} · {formatHistoryWeight(row.bodyWeight)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>No nutrition logged yet.</p>
        )}
      </section>
    </>
  );
}
