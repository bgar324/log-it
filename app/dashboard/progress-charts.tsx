"use client";

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getWeightUnitLabel, type WeightUnit } from "@/lib/weight-unit";
import { styles } from "./dashboard.styles";

type ProgressChartsProps = {
  weeklySeries: Array<{
    label: string;
    rangeLabel: string;
    sessions: number;
    volume: number;
  }>;
  weightUnit: WeightUnit;
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

function formatWeekTooltipLabel(
  label: ReactNode,
  payload?: ReadonlyArray<{ payload?: { rangeLabel?: string } }>,
): ReactNode {
  return payload?.[0]?.payload?.rangeLabel ?? label;
}

export function ProgressCharts({ weeklySeries, weightUnit }: ProgressChartsProps) {
  const unitLabel = getWeightUnitLabel(weightUnit);

  return (
    <section className={styles.chartGrid} aria-label="Progress charts">
      <article className={styles.chartPanel}>
        <h2 className={styles.panelTitle}>Workout frequency</h2>
        <p className={styles.panelSubtitle}>Sessions started per week.</p>

        <div className={styles.chartFrame}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weeklySeries}
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
                width={28}
                tick={{ fill: "var(--muted)", fontSize: "0.65rem" }}
              />
              <Tooltip
                cursor={TOOLTIP_CURSOR}
                contentStyle={TOOLTIP_CONTENT_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                labelFormatter={formatWeekTooltipLabel}
              />
              <Bar
                dataKey="sessions"
                fill="var(--text)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className={styles.chartPanel}>
        <h2 className={styles.panelTitle}>Volume trend</h2>
        <p className={styles.panelSubtitle}>
          Total weekly load ({unitLabel} * reps).
        </p>

        <div className={styles.chartFrame}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weeklySeries}
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
                width={44}
                tick={{ fill: "var(--muted)", fontSize: "0.65rem" }}
              />
              <Tooltip
                cursor={TOOLTIP_CURSOR}
                contentStyle={TOOLTIP_CONTENT_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                labelFormatter={formatWeekTooltipLabel}
                formatter={(value, name) => {
                  if (name !== "volume") {
                    return value;
                  }

                  const displayValue =
                    typeof value === "number" ? value : Number(value);

                  return [`${displayValue} ${unitLabel}`, "Volume"];
                }}
              />
              <Bar
                dataKey="volume"
                fill="var(--text)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}
