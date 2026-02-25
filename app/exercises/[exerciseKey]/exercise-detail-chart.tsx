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
import styles from "./exercise-detail.module.css";

type ExerciseDetailChartProps = {
  series: Array<{
    label: string;
    bestWeight: number;
    performedAtLabel: string;
  }>;
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

export function ExerciseDetailChart({ series }: ExerciseDetailChartProps) {
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
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={36}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
          />
          <Tooltip
            cursor={TOOLTIP_CURSOR}
            contentStyle={TOOLTIP_CONTENT_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            formatter={(value) => [`${value} lb`, "Best weight"]}
          />
          <Line
            type="monotone"
            dataKey="bestWeight"
            stroke="var(--text)"
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
