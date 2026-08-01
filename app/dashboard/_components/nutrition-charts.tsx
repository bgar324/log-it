"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatWeightWithUnit, type WeightUnit } from "@/lib/weight-unit";

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

type CalorieRow = {
  label: string;
  calories: number;
  calorieTarget: number | null;
  proteinGrams: number;
};

export function NutritionCaloriesChart({ chartRows }: { chartRows: CalorieRow[] }) {
  return (
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
  );
}

export function BodyWeightChart({
  bodyWeightSeries,
  weightUnit,
}: {
  bodyWeightSeries: Array<{ label: string; weight: number | null }>;
  weightUnit: WeightUnit;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={bodyWeightSeries} margin={{ top: 8, right: 8, left: -8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted)", fontSize: "0.65rem" }}
        />
        <YAxis
          domain={["dataMin - 2", "dataMax + 2"]}
          tickLine={false}
          axisLine={false}
          width={42}
          tick={{ fill: "var(--muted)", fontSize: "0.65rem" }}
        />
        <Tooltip
          cursor={TOOLTIP_CURSOR}
          contentStyle={TOOLTIP_CONTENT_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          formatter={(value) => [
            formatWeightWithUnit(Number(value), weightUnit, {
              maximumFractionDigits: 1,
            }),
            "Body weight",
          ]}
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="var(--text)"
          strokeWidth={1.6}
          dot={{ r: 2, fill: "var(--text)" }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
