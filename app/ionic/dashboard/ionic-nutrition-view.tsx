"use client";

import {
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  useIonToast,
} from "@ionic/react";
import posthog from "posthog-js";
import { Suspense, lazy, useEffect, useState } from "react";
import type { DashboardNutritionData } from "@/app/dashboard/dashboard-types";
import {
  formatWeightWithUnit,
  getWeightUnitLabel,
  type WeightUnit,
} from "@/lib/weight-unit";
import {
  buildIonicRecallOptions,
  type IonicRecallOption,
} from "./ionic-nutrition-recall";
import type { IonicDashboardViewProps } from "./ionic-view-props";

// Code splitting: recharts is ~186kb gzipped, so a static import would put it
// in the shell's entry chunk. A lazy boundary requires a dynamic specifier.
// The chart bodies themselves are the ones the legacy panel already draws.
const NutritionCaloriesChart = lazy(async () => {
  const chartModule = await import("@/app/dashboard/_components/nutrition-charts");

  return { default: chartModule.NutritionCaloriesChart };
});
const BodyWeightChart = lazy(async () => {
  const chartModule = await import("@/app/dashboard/_components/nutrition-charts");

  return { default: chartModule.BodyWeightChart };
});

type ChartMode = "day" | "week" | "month";

type NutritionResponse =
  | { ok: true; nutrition: DashboardNutritionData }
  | { ok?: false; error?: string };

const INTEGER_FORMAT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const DECIMAL_FORMAT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const CHART_FRAME_STYLE = { height: "13rem" } as const;

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

function formatBodyWeight(value: number | null, weightUnit: WeightUnit) {
  return value === null
    ? "--"
    : formatWeightWithUnit(value, weightUnit, { maximumFractionDigits: 1 });
}

export function IonicNutritionView({ data, onRefresh }: IonicDashboardViewProps) {
  const [presentToast] = useIonToast();
  const [nutrition, setNutrition] = useState(data.nutrition);
  const [caloriesInput, setCaloriesInput] = useState(`${data.nutrition.today.calories || ""}`);
  const [proteinInput, setProteinInput] = useState(
    formatInputNumber(data.nutrition.today.proteinGrams),
  );
  const [bmrInput, setBmrInput] = useState(`${data.nutrition.bmrCalories ?? ""}`);
  const [bodyWeightInput, setBodyWeightInput] = useState(
    formatInputNumber(data.nutrition.today.bodyWeight),
  );
  const [chartMode, setChartMode] = useState<ChartMode>("day");
  const [isSaving, setIsSaving] = useState(false);
  const [activeRecallKey, setActiveRecallKey] = useState<string | null>(null);
  const weightUnit = data.user.preferredWeightUnit;
  const unitLabel = getWeightUnitLabel(weightUnit);

  // The server payload is authoritative: a shell refresh, a unit change or a
  // save response all re-seed the form rather than leaving stale typing behind.
  useEffect(() => {
    setNutrition(data.nutrition);
  }, [data.nutrition]);

  useEffect(() => {
    setCaloriesInput(`${nutrition.today.calories || ""}`);
    setProteinInput(formatInputNumber(nutrition.today.proteinGrams));
    setBmrInput(`${nutrition.bmrCalories ?? ""}`);
    setBodyWeightInput(formatInputNumber(nutrition.today.bodyWeight));
    setActiveRecallKey(null);
  }, [nutrition]);

  const chartRows = nutrition.chart[chartMode];
  const recallOptions = buildIonicRecallOptions(nutrition.history);
  const historyRows = nutrition.history.filter(
    (row) => row.calories > 0 || row.proteinGrams > 0 || row.bodyWeight !== null,
  );
  const bodyWeightSeries = [...nutrition.history]
    .reverse()
    .filter((row) => row.bodyWeight !== null)
    .map((row) => ({ label: row.label, weight: row.bodyWeight }));
  const bmrMeta =
    nutrition.bmrCalories === null
      ? "Set target"
      : formatBmrDelta(nutrition.today.calorieDeltaFromBmr);

  function applyRecall(option: IonicRecallOption) {
    setCaloriesInput(`${option.calories}`);
    setProteinInput(formatInputNumber(option.proteinGrams));
    setActiveRecallKey(option.key);
  }

  async function handleSave() {
    if (isSaving) {
      return;
    }

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

      if (!response.ok || !payload.ok) {
        const message = payload.ok ? null : payload.error;

        throw new Error(message ?? "Unable to save nutrition.");
      }

      setNutrition(payload.nutrition);
      posthog.capture("nutrition_targets_updated");
      // The day's numbers feed the home view and the charts, so the shell's
      // payload is refetched rather than patched in two places.
      onRefresh();
      await presentToast({
        message: "Nutrition saved.",
        duration: 2000,
        position: "bottom",
      });
    } catch (error) {
      await presentToast({
        message:
          error instanceof Error ? error.message : "Unable to save nutrition.",
        duration: 6000,
        position: "bottom",
        color: "danger",
        buttons: [{ text: "Dismiss", role: "cancel" }],
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      {/* Today's numbers are the form values below; a tile wall prints them twice. */}
      <IonText>
        <p>
          {INTEGER_FORMAT.format(nutrition.today.calories)} cal ·{" "}
          {DECIMAL_FORMAT.format(nutrition.today.proteinGrams)}g protein
        </p>
      </IonText>
      <IonText color="medium">
        <p>
          {nutrition.bmrCalories === null
            ? "No BMR target set"
            : `${INTEGER_FORMAT.format(nutrition.bmrCalories)} cal target · ${bmrMeta}`}
          {nutrition.today.bodyWeight === null
            ? ""
            : ` · ${formatBodyWeight(nutrition.today.bodyWeight, weightUnit)} today`}
        </p>
      </IonText>

      <IonList inset inert={isSaving}>
        <IonListHeader>
          <IonLabel>
            <h2>Today</h2>
            <p>
              {recallOptions.length > 0
                ? "Reuse a day you already logged, or type what you know."
                : "Type what you know. Blank fields stay blank."}
            </p>
          </IonLabel>
        </IonListHeader>

        {recallOptions.map((option) => (
          <IonItem
            key={option.key}
            button
            detail={false}
            color={activeRecallKey === option.key ? "light" : undefined}
            onClick={() => applyRecall(option)}
          >
            <IonLabel>{option.label}</IonLabel>
            <IonNote slot="end">
              {INTEGER_FORMAT.format(option.calories)} cal ·{" "}
              {DECIMAL_FORMAT.format(option.proteinGrams)}g
            </IonNote>
          </IonItem>
        ))}

        <IonItem>
          <IonInput
            label="Calories"
            labelPlacement="stacked"
            inputmode="numeric"
            value={caloriesInput}
            onIonInput={(event) => {
              setCaloriesInput((event.detail.value ?? "").replace(/\D/g, ""));
              setActiveRecallKey(null);
            }}
          />
        </IonItem>
        <IonItem>
          <IonInput
            label="Protein (g)"
            labelPlacement="stacked"
            inputmode="decimal"
            value={proteinInput}
            onIonInput={(event) => {
              setProteinInput((event.detail.value ?? "").replace(/[^0-9.]/g, ""));
              setActiveRecallKey(null);
            }}
          />
        </IonItem>
        <IonItem>
          <IonInput
            label="BMR"
            labelPlacement="stacked"
            inputmode="numeric"
            value={bmrInput}
            onIonInput={(event) => setBmrInput((event.detail.value ?? "").replace(/\D/g, ""))}
          />
        </IonItem>
        <IonItem>
          <IonInput
            label={`Weight (${unitLabel})`}
            labelPlacement="stacked"
            inputmode="decimal"
            value={bodyWeightInput}
            onIonInput={(event) =>
              setBodyWeightInput((event.detail.value ?? "").replace(/[^0-9.]/g, ""))
            }
          />
        </IonItem>
      </IonList>

      <IonButton expand="block" disabled={isSaving} onClick={() => void handleSave()}>
        {isSaving ? <IonSpinner name="dots" /> : "Save"}
      </IonButton>
      <IonListHeader>
        <IonLabel>Calories vs BMR</IonLabel>
      </IonListHeader>
      <IonSegment
        value={chartMode}
        onIonChange={(event) => setChartMode(event.detail.value as ChartMode)}
      >
        <IonSegmentButton value="day">Day</IonSegmentButton>
        <IonSegmentButton value="week">Week</IonSegmentButton>
        <IonSegmentButton value="month">Month</IonSegmentButton>
      </IonSegment>
      <div style={CHART_FRAME_STYLE}>
        <Suspense fallback={<IonSpinner name="dots" />}>
          <NutritionCaloriesChart chartRows={chartRows} />
        </Suspense>
      </div>

      {bodyWeightSeries.length >= 2 ? (
        <>
          <IonListHeader>
            <IonLabel>Body weight</IonLabel>
          </IonListHeader>
          <div style={CHART_FRAME_STYLE}>
            <Suspense fallback={<IonSpinner name="dots" />}>
              <BodyWeightChart
                bodyWeightSeries={bodyWeightSeries}
                weightUnit={weightUnit}
              />
            </Suspense>
          </div>
        </>
      ) : null}

      <IonListHeader>
        <IonLabel>History</IonLabel>
      </IonListHeader>
      {historyRows.length > 0 ? (
        <IonList>
          {historyRows.map((row) => (
            <IonItem key={row.dateKey}>
              <IonLabel>{row.label}</IonLabel>
              <div slot="end" className="ion-text-end">
                <IonNote>
                  {INTEGER_FORMAT.format(row.calories)} cal ·{" "}
                  {DECIMAL_FORMAT.format(row.proteinGrams)}g
                </IonNote>
                <br />
                <IonNote>
                  {formatBmrDelta(row.calorieDeltaFromBmr)} ·{" "}
                  {formatBodyWeight(row.bodyWeight, weightUnit)}
                </IonNote>
              </div>
            </IonItem>
          ))}
        </IonList>
      ) : (
        <IonText color="medium">
          <p>No nutrition logged yet.</p>
        </IonText>
      )}
    </>
  );
}
