"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getWeightUnitLabel, type WeightUnit } from "@/lib/weight-unit";
import styles from "./exercise-detail.module.css";

type ExerciseDetailChartProps = {
  series: Array<{
    label: string;
    performedAtLabel: string;
    bestWeight: number;
    topSetReps: number;
    estimatedOneRepMax: number;
  }>;
  metric: "weight" | "strength";
  weightUnit: WeightUnit;
};

const CHART_GRID_STROKE = "color-mix(in srgb, var(--text) 14%, transparent)";
const TOOLTIP_CURSOR = { stroke: "color-mix(in srgb, var(--text) 18%, transparent)" };
const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: "color-mix(in srgb, var(--surface) 88%, var(--bg))",
  border: "1px solid color-mix(in srgb, var(--text) 14%, transparent)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "var(--text)",
};
const TOOLTIP_LABEL_STYLE = { color: "var(--muted)" };

function toDisplayNumber(value: number) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

export function ExerciseDetailChart({
  series,
  metric,
  weightUnit,
}: ExerciseDetailChartProps) {
  const dataKey = metric === "weight" ? "bestWeight" : "estimatedOneRepMax";
  const stroke = metric === "weight"
    ? "var(--text)"
    : "color-mix(in srgb, #7bc469 78%, var(--text))";
  const unitLabel = getWeightUnitLabel(weightUnit);

  return (
    <div className={styles.chartFrame}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={series}
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
            allowDecimals={true}
            tickLine={false}
            axisLine={false}
            width={46}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
          />
          <Tooltip
            cursor={TOOLTIP_CURSOR}
            contentStyle={TOOLTIP_CONTENT_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            labelFormatter={(label, payload) => {
              if (!payload || payload.length === 0) {
                return label;
              }

              const point = payload[0]?.payload as ExerciseDetailChartProps["series"][number];
              return point.performedAtLabel;
            }}
            formatter={(rawValue, _name, item) => {
              const point = item.payload as ExerciseDetailChartProps["series"][number];
              const value = typeof rawValue === "number" ? rawValue : Number(rawValue);

              if (metric === "weight") {
                return [`${toDisplayNumber(value)} ${unitLabel}`, "Best top set"];
              }

              const topSetWeight = toDisplayNumber(point.bestWeight);

              return [
                `${toDisplayNumber(value)} ${unitLabel}`,
                `Est. 1RM (${topSetWeight} ${unitLabel} x ${point.topSetReps})`,
              ];
            }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={stroke}
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
