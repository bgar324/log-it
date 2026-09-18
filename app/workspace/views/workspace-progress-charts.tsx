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

export type WorkspaceProgressChartMetric = "sessions" | "volume";

type WorkspaceProgressChartProps = {
  weeklySeries: Array<{
    label: string;
    rangeLabel: string;
    sessions: number;
    volume: number;
  }>;
  metric: WorkspaceProgressChartMetric;
  weightUnit: WeightUnit;
};

// Recharts colours are inline strings, not classes, so they cannot read the
// Tailwind theme. They read the same `--text`/`--muted`/`--surface` vocabulary
// the shipped charts use, and the workspace maps that vocabulary onto its own
// tokens via the `workspace-chart-theme` wrapper this chart is rendered inside.
const CHART_GRID_STROKE = "color-mix(in srgb, var(--text) 14%, transparent)";
const TOOLTIP_CURSOR = { fill: "color-mix(in srgb, var(--text) 6%, transparent)" };
const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: "var(--surface)",
  border: "1px solid color-mix(in srgb, var(--text) 14%, transparent)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "var(--text)",
};
const TOOLTIP_LABEL_STYLE = { color: "var(--muted)", fontSize: "11px" };
const AXIS_TICK = { fill: "var(--muted)", fontSize: 11 };

function formatWeekTooltipLabel(
  label: ReactNode,
  payload?: ReadonlyArray<{ payload?: { rangeLabel?: string } }>,
): ReactNode {
  return payload?.[0]?.payload?.rangeLabel ?? label;
}

/**
 * One weekly bar chart, chrome-free: the workspace supplies the card, the
 * heading and the sentence that explains it. The legacy `ProgressCharts` bakes
 * in the dashboard's own panel chrome, which depends on `--dashboard-border`
 * being declared by `DashboardShell`; outside that shell the border falls back
 * to `currentColor` and prints an opaque frame, so it cannot be reused here.
 */
export function WorkspaceProgressChart({
  weeklySeries,
  metric,
  weightUnit,
}: WorkspaceProgressChartProps) {
  const unitLabel = getWeightUnitLabel(weightUnit);

  return (
    <div className="workspace-chart-theme h-[15rem] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={weeklySeries}
          margin={{ top: 8, right: 8, left: -8, bottom: 4 }}
          barCategoryGap="28%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={metric === "volume" ? 44 : 28}
            tick={AXIS_TICK}
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

              const displayValue = typeof value === "number" ? value : Number(value);

              return [`${displayValue} ${unitLabel}`, "Volume"];
            }}
          />
          <Bar dataKey={metric} fill="var(--text)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
