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

export type IonicWeeklyMetric = "sessions" | "volume";

type IonicWeeklyChartProps = {
  weeklySeries: Array<{
    label: string;
    rangeLabel: string;
    sessions: number;
    volume: number;
  }>;
  metric: IonicWeeklyMetric;
  weightUnit: WeightUnit;
};

// The app's own theme tokens, which follow light/dark app-wide. Ionic's
// palette variables are not what the rest of Logit's charts are drawn in.
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
const AXIS_TICK = { fill: "var(--muted)", fontSize: "0.65rem" };
const CHART_MARGIN = { top: 8, right: 8, left: -8, bottom: 4 };

// The x axis prints a short week label; the tooltip is where the real date
// range belongs, so hovering a bar never leaves you guessing which week it is.
function formatWeekTooltipLabel(
  label: ReactNode,
  payload?: ReadonlyArray<{ payload?: { rangeLabel?: string } }>,
): ReactNode {
  return payload?.[0]?.payload?.rangeLabel ?? label;
}

// Weekly volume runs into five digits, and a 390px-wide chart clips that tick
// against the plot area. Thousands are the resolution a weekly trend is read
// at; the exact figure is one tap away in the tooltip.
function formatVolumeTick(value: number) {
  return value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}`;
}

export function IonicWeeklyChart({
  weeklySeries,
  metric,
  weightUnit,
}: IonicWeeklyChartProps) {
  const unitLabel = getWeightUnitLabel(weightUnit);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={weeklySeries} margin={CHART_MARGIN} barCategoryGap="28%">
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={metric === "volume" ? 34 : 28}
          tickFormatter={metric === "volume" ? formatVolumeTick : undefined}
          tick={AXIS_TICK}
        />
        <Tooltip
          cursor={TOOLTIP_CURSOR}
          contentStyle={TOOLTIP_CONTENT_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          labelFormatter={formatWeekTooltipLabel}
          formatter={(value, name) => {
            if (name !== "volume") {
              return [value, "Sessions"];
            }

            const displayValue = typeof value === "number" ? value : Number(value);

            return [`${displayValue} ${unitLabel}`, "Volume"];
          }}
        />
        <Bar dataKey={metric} fill="var(--text)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
