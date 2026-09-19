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
import {
  formatMetricNumber,
  formatMetricValue,
  getAnalysisMetric,
  metricValue,
  type AnalysisBucket,
  type AnalysisMetric,
} from "./analysis-model";

type AnalysisChartProps = {
  /** Mutable array: recharts' `data` prop is typed `any[]`. */
  buckets: AnalysisBucket[];
  metric: AnalysisMetric;
  unitLabel: string;
  /** Bars between printed x-axis ticks; 0 prints all of them. */
  tickInterval: number;
  /** False under `prefers-reduced-motion`, where bars must simply appear. */
  animate: boolean;
};

const GRID_STROKE = "color-mix(in srgb, var(--text) 10%, transparent)";
const AXIS_TICK = { fill: "var(--muted)", fontSize: "0.68rem" };
const TOOLTIP_CURSOR = { fill: "color-mix(in srgb, var(--text) 5%, transparent)" };
const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: "var(--app-surface-raised)",
  border: "1px solid var(--app-line)",
  borderRadius: "12px",
  fontSize: "0.8125rem",
  color: "var(--text)",
};
const TOOLTIP_LABEL_STYLE = { color: "var(--muted)", fontSize: "0.72rem" };
const CHART_MARGIN = { top: 6, right: 4, left: -14, bottom: 0 };

/**
 * The bar's own span, not its axis label: "Mon" or "Sep 12" is enough on the
 * axis, but a tooltip that does not say which days it covers is a riddle.
 */
function formatBucketTooltipLabel(
  label: ReactNode,
  payload?: ReadonlyArray<{ payload?: { rangeLabel?: string } }>,
): ReactNode {
  return payload?.[0]?.payload?.rangeLabel ?? label;
}

/**
 * One chart, one metric, one window. Switching metric keeps the same bars and
 * re-animates their height, so the change reads as the same subject measured
 * differently rather than as a new screen.
 */
export function AnalysisChart({
  buckets,
  metric,
  unitLabel,
  tickInterval,
  animate,
}: AnalysisChartProps) {
  const metricOption = getAnalysisMetric(metric);
  // An all-zero window would otherwise collapse the axis onto a single 0 line,
  // which looks like a broken chart rather than a quiet period.
  const axisMax = Math.max(1, ...buckets.map((bucket) => metricValue(bucket, metric)));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={buckets}
        margin={CHART_MARGIN}
        barCategoryGap={buckets.length > 30 ? "12%" : "24%"}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
        <XAxis
          dataKey="label"
          interval={tickInterval}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          minTickGap={4}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={metric === "volume" ? 46 : 30}
          tick={AXIS_TICK}
          tickFormatter={(value: number) => formatMetricNumber(value, metric)}
          domain={[0, axisMax]}
        />
        <Tooltip
          cursor={TOOLTIP_CURSOR}
          contentStyle={TOOLTIP_CONTENT_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          labelFormatter={formatBucketTooltipLabel}
          formatter={(value) => [
            formatMetricValue(typeof value === "number" ? value : Number(value), metric, unitLabel),
            metricOption.label,
          ]}
        />
        <Bar
          dataKey={metric}
          fill="var(--app-accent)"
          radius={[3, 3, 0, 0]}
          isAnimationActive={animate}
          animationDuration={220}
          animationEasing="ease-out"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
