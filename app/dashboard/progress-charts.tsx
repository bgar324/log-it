"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getWeightUnitLabel, type WeightUnit } from "@/lib/weight-unit";
import styles from "./dashboard.module.css";

type ProgressChartsProps = {
  weeklySeries: Array<{
    label: string;
    sessions: number;
    volume: number;
  }>;
  weightUnit: WeightUnit;
};

const CHART_GRID_STROKE = "color-mix(in srgb, var(--text) 14%, transparent)";
const TOOLTIP_CURSOR = { stroke: "color-mix(in srgb, var(--text) 18%, transparent)" };
const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: "var(--surface)",
  border: "1px solid color-mix(in srgb, var(--text) 14%, transparent)",
  borderRadius: "6px",
  fontSize: "12px",
  color: "var(--text)",
};
const TOOLTIP_LABEL_STYLE = { color: "var(--muted)" };

export function ProgressCharts({ weeklySeries, weightUnit }: ProgressChartsProps) {
  const unitLabel = getWeightUnitLabel(weightUnit);

  return (
    <section className={styles.chartGrid} aria-label="Progress charts">
      <article className={styles.chartPanel}>
        <h2 className={styles.panelTitle}>Workout frequency</h2>
        <p className={styles.panelSubtitle}>Sessions started per week.</p>

        <div className={styles.chartFrame}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={weeklySeries}
              margin={{ top: 8, right: 8, left: -8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={28}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
              />
              <Tooltip
                cursor={TOOLTIP_CURSOR}
                contentStyle={TOOLTIP_CONTENT_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
              />
              <Area
                type="monotone"
                dataKey="sessions"
                stroke="var(--text)"
                strokeWidth={2}
                fill="var(--text)"
                fillOpacity={0.07}
              />
            </AreaChart>
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
            <LineChart
              data={weeklySeries}
              margin={{ top: 8, right: 8, left: -8, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={44}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
              />
              <Tooltip
                cursor={TOOLTIP_CURSOR}
                contentStyle={TOOLTIP_CONTENT_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                formatter={(value, name) => {
                  if (name !== "volume") {
                    return value;
                  }

                  const displayValue =
                    typeof value === "number" ? value : Number(value);

                  return [`${displayValue} ${unitLabel}`, "Volume"];
                }}
              />
              <Line
                type="monotone"
                dataKey="volume"
                stroke="var(--text)"
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}
