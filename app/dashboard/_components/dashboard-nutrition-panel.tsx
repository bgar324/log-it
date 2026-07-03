"use client";

import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatWeightWithUnit,
  getWeightUnitLabel,
  type WeightUnit,
} from "@/lib/weight-unit";
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

const CHART_GRID_STROKE = "color-mix(in srgb, var(--text) 14%, transparent)";
const TOOLTIP_CURSOR = { fill: "color-mix(in srgb, var(--text) 5%, transparent)" };
const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: "var(--surface)",
  border: "1px solid color-mix(in srgb, var(--text) 14%, transparent)",
  borderRadius: "6px",
  fontSize: "0.72rem",
  color: "var(--text)",
};
const TOOLTIP_LABEL_STYLE = { color: "var(--muted)", fontSize: "0.65rem" };

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
  const unitLabel = getWeightUnitLabel(weightUnit);
  const chartRows = nutrition.chart[chartMode];
  const historyRows = nutrition.history.filter(
    (row) => row.calories > 0 || row.proteinGrams > 0 || row.bodyWeight !== null,
  );

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
  }, [nutrition]);

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
      <section className={`${styles.kpiGrid} ${styles.progressKpiGrid}`} aria-label="Nutrition summary">
        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Calories</p>
          <p className={styles.kpiValue}>{formatNumber(nutrition.today.calories)}</p>
        </article>
        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Protein</p>
          <p className={styles.kpiValue}>{formatNumber(nutrition.today.proteinGrams, 1)}g</p>
        </article>
        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>BMR</p>
          <p className={styles.kpiValue}>
            {nutrition.bmrCalories === null ? "--" : formatNumber(nutrition.bmrCalories)}
          </p>
          <p className={styles.nutritionSummaryMeta}>{bmrMeta}</p>
        </article>
        <article className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Body weight</p>
          <p className={styles.kpiValue}>{bodyWeightValue}</p>
        </article>
      </section>

      <section className={styles.panel} aria-label="Today nutrition log">
        <div className={styles.panelHead}>
          <div>
            <h2 className={styles.panelTitle}>Today</h2>
            <p className={styles.panelSubtitle}>Log intake, target, and body weight.</p>
          </div>
        </div>

        <div className={styles.nutritionForm}>
          <label className={styles.nutritionField}>
            Calories
            <input
              className={styles.nutritionInput}
              inputMode="numeric"
              value={caloriesInput}
              onChange={(event) => setCaloriesInput(event.target.value.replace(/\D/g, ""))}
            />
          </label>
          <label className={styles.nutritionField}>
            Protein (g)
            <input
              className={styles.nutritionInput}
              inputMode="decimal"
              value={proteinInput}
              onChange={(event) => setProteinInput(event.target.value.replace(/[^0-9.]/g, ""))}
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
            aria-busy={isSaving}
            onClick={handleSave}
          >
            {isSaving ? (
              <Loader2 className={`${styles.nutritionButtonIcon} animate-spin`} aria-hidden="true" />
            ) : (
              <Save className={styles.nutritionButtonIcon} aria-hidden="true" />
            )}
            Save
          </button>
        </div>
      </section>

      <section className={styles.chartPanel} aria-label="Calories vs BMR">
        <div className={styles.nutritionChartHead}>
          <h2 className={styles.panelTitle}>Calories vs BMR</h2>
          <div className={styles.nutritionSegments} aria-label="Nutrition chart range">
            {(["day", "week", "month"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={styles.nutritionSegmentButton}
                data-active={chartMode === mode}
                aria-pressed={chartMode === mode}
                onClick={() => setChartMode(mode)}
              >
                {mode === "day" ? "Day" : mode === "week" ? "Week" : "Month"}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.nutritionChartFrame}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartRows}
              margin={{ top: 8, right: 8, left: -8, bottom: 4 }}
              barCategoryGap="28%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted)", fontSize: "0.65rem" }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={42}
                tick={{ fill: "var(--muted)", fontSize: "0.65rem" }}
              />
              <Tooltip
                cursor={TOOLTIP_CURSOR}
                contentStyle={TOOLTIP_CONTENT_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                formatter={(value, name) => {
                  const label = name === "calorieTarget" ? "BMR" : "Calories";
                  const suffix = name === "proteinGrams" ? "g" : "";
                  return [`${value}${suffix}`, label];
                }}
              />
              <Bar dataKey="calories" fill="var(--text)" radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="calorieTarget"
                dot={false}
                stroke="var(--muted)"
                strokeDasharray="4 4"
                strokeWidth={1.4}
                connectNulls={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className={styles.panel} aria-label="Nutrition history">
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
