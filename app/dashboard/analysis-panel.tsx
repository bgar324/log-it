"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { ActivityCalendar } from "@/app/components/activity-calendar";
import { getWeightUnitLabel, type WeightUnit } from "@/lib/weight-unit";
import {
  ANALYSIS_METRICS,
  ANALYSIS_PERIODS,
  buildAnalysisNotes,
  buildAnalysisWindow,
  computeWeeklyConsistency,
  formatMetricNumber,
  formatMetricValue,
  getAnalysisMetric,
  metricValue,
  type AnalysisMetric,
  type AnalysisPeriod,
} from "./analysis-model";
import { analysisStyles } from "./analysis.styles";
import type { DashboardClientData } from "./dashboard-types";

const AnalysisChart = dynamic(
  () => import("./analysis-chart").then((module) => module.AnalysisChart),
  {
    loading: () => (
      <div
        className="h-full w-full rounded-[14px] bg-[color-mix(in_srgb,var(--text)_5%,transparent)]"
        aria-hidden="true"
      />
    ),
  },
);

/** Weeks of calendar history behind the consistency ratio and the heatmap. */
const CONSISTENCY_WEEKS = 12;

type AnalysisPanelProps = {
  progress: DashboardClientData["progress"];
  weightUnit: WeightUnit;
};

export function AnalysisPanel({ progress, weightUnit }: AnalysisPanelProps) {
  const [period, setPeriod] = useState<AnalysisPeriod>("week");
  const [metric, setMetric] = useState<AnalysisMetric>("sessions");
  // Initial data appears without a reveal; only deliberate selections animate.
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [hasChangedSelection, setHasChangedSelection] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setMotionAllowed(!query.matches);

    apply();
    query.addEventListener("change", apply);

    return () => query.removeEventListener("change", apply);
  }, []);

  const unitLabel = getWeightUnitLabel(weightUnit);
  const analysisWindow = useMemo(
    () => buildAnalysisWindow(progress.dailySeries, progress.asOfDate, period),
    [progress.dailySeries, progress.asOfDate, period],
  );
  const notes = useMemo(
    () => buildAnalysisNotes(analysisWindow, metric, unitLabel),
    [analysisWindow, metric, unitLabel],
  );
  const consistency = useMemo(
    () => computeWeeklyConsistency(progress.dailySeries, progress.asOfDate, CONSISTENCY_WEEKS),
    [progress.dailySeries, progress.asOfDate],
  );
  const activityDays = useMemo(
    () => progress.dailySeries.map((day) => ({ date: day.date, count: day.sessions })),
    [progress.dailySeries],
  );

  const metricOption = getAnalysisMetric(metric);
  const currentValue = metricValue(analysisWindow.totals, metric);
  const previousValue = metricValue(analysisWindow.previous.totals, metric);
  const difference = currentValue - previousValue;
  const deltaText = !analysisWindow.comparable
    ? "no earlier period to compare"
    : previousValue === 0 && currentValue === 0
      ? "no activity in either period"
      : previousValue === 0
        ? "none in the previous period"
        : difference === 0
          ? "same as before"
          : `${difference > 0 ? "+" : "-"}${formatMetricNumber(
              Math.round(Math.abs(difference) * 100) / 100,
              metric,
            )} vs before`;

  return (
    <>

      <section className={analysisStyles.chartCard}>
        {analysisWindow.hasHistory ? (
          <div className={analysisStyles.periodRow}>
            <div className={analysisStyles.periodTrack} role="group" aria-label="Period">
              {ANALYSIS_PERIODS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`${analysisStyles.periodButton} ${
                    option.value === period ? analysisStyles.periodButtonActive : ""
                  }`}
                  aria-pressed={option.value === period}
                  onClick={() => { setHasChangedSelection(true); setPeriod(option.value); }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* The answer, then the window it answers for. A long compact volume
            reading needs the whole line, so nothing shares it. */}
        <div className={analysisStyles.readout}>
          <p className={analysisStyles.readoutValue}>
            {formatMetricValue(currentValue, metric, unitLabel)}
          </p>
          <p className={analysisStyles.readoutMetric}>
            {metricOption.label} · {analysisWindow.period.windowNoun}
          </p>
        </div>

        {analysisWindow.hasHistory ? (
          <>
            <p className={analysisStyles.readoutRange}>
              {analysisWindow.rangeLabel}
              {" · "}
              <span className={analysisStyles.readoutDelta}>{deltaText}</span>
            </p>

            <div className={analysisStyles.chartFrame}>
              <AnalysisChart
                buckets={analysisWindow.buckets}
                metric={metric}
                unitLabel={unitLabel}
                tickInterval={analysisWindow.period.tickInterval}
                animate={hasChangedSelection && motionAllowed}
              />
            </div>

            {/* Readouts and controls at once: each cell states its own total for
                the window above, and pressing it makes the chart show that
                measure. Nothing here is decorative. */}
            <div className={analysisStyles.metricRow}>
              {ANALYSIS_METRICS.map((option) => {
                const isActive = option.value === metric;
                const value = metricValue(analysisWindow.totals, option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`${analysisStyles.metricButton} ${
                      isActive ? analysisStyles.metricButtonActive : ""
                    }`}
                    aria-pressed={isActive}
                    aria-label={`Show ${option.label.toLowerCase()} for ${analysisWindow.period.windowLabel}`}
                    onClick={() => { setHasChangedSelection(true); setMetric(option.value); }}
                  >
                    <span className={analysisStyles.metricButtonLabel}>{option.label}</span>
                    <span
                      className={`${analysisStyles.metricButtonValue} ${
                        isActive ? analysisStyles.metricButtonValueActive : ""
                      }`}
                    >
                      {formatMetricNumber(value, option.value)}
                    </span>
                    <span className={analysisStyles.metricButtonUnit}>{option.value === "volume" ? `${unitLabel} · reps` : "\u00a0"}</span>
                  </button>
                );
              })}
            </div>

            <ul className={analysisStyles.notes}>
              {notes.map((note) => (
                <li key={note} className={analysisStyles.note}>
                  {note}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className={analysisStyles.chartEmpty}>
            <p className={analysisStyles.chartEmptyTitle}>No recent workouts.</p>
            <p className={analysisStyles.chartEmptyNote}>
              No workouts recorded in {analysisWindow.rangeLabel}.
            </p>
          </div>
        )}
      </section>

      <div className={analysisStyles.lowerGrid}>
        <section className={analysisStyles.card}>
          <h2 className={analysisStyles.cardTitle}>Recorded activity</h2>
          <ActivityCalendar
            days={activityDays}
            endDate={progress.asOfDate}
            weeks={CONSISTENCY_WEEKS}
            shape="tile"
            label={`Days with a recorded workout over the last ${CONSISTENCY_WEEKS} weeks. Rest days are not marked as missed.`}
          />
          <p className={analysisStyles.cardNote}>
            One tile per day over the last {CONSISTENCY_WEEKS} weeks. A filled tile is a
            day with a recorded workout; an empty one is simply a day you did not log.
          </p>
        </section>

        <section className={analysisStyles.card}>
          <h2 className={analysisStyles.cardTitle}>Weekly consistency</h2>

          {consistency.hasHistory ? (
            <>
              <div className={analysisStyles.streakRow}>
                <div className={analysisStyles.streakItem}>
                  <p className={analysisStyles.streakValue}>{consistency.streakWeeks}</p>
                  <p className={analysisStyles.streakLabel}>
                    active {consistency.streakWeeks === 1 ? "week" : "weeks"} in a row
                  </p>
                </div>
                <div className={analysisStyles.streakItem}>
                  <p className={analysisStyles.streakValue}>
                    {consistency.activeWeeks}/{consistency.weeksConsidered}
                  </p>
                  <p className={analysisStyles.streakLabel}>
                    {consistency.weeksConsidered === 1 ? "week" : "weeks"} recorded
                  </p>
                </div>
              </div>

              {/* The rule is part of the number. A streak without its rule is
                  the kind of score that punishes a planned rest day. */}
              <p className={analysisStyles.ruleText}>
                A week counts as active once you record any workout in it, Monday to
                Sunday. Rest days never end a streak.
              </p>
              <p className={analysisStyles.ruleText}>
                {consistency.currentWeekRecorded
                  ? "This week is already counted."
                  : "This week has nothing recorded yet, so it is still pending rather than a break."}{" "}
                Recorded weeks are measured since your first logged workout, up to{" "}
                {CONSISTENCY_WEEKS} weeks. No plan is compared.
              </p>
            </>
          ) : (
            <p className={analysisStyles.cardNote}>
              No workouts recorded in the last {CONSISTENCY_WEEKS} weeks.
              Rest days are never counted as misses.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
