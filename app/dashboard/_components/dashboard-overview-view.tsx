"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Play } from "lucide-react";
import { formatWeightWithUnit, type WeightUnit } from "@/lib/weight-unit";
import { toDatabaseDateFromInput } from "@/lib/workout-utils";
import { LinkPendingOverlay } from "@/app/components/link-pending";
import { MonthlyActivityCalendar } from "@/app/components/activity-calendar";
import { useStoredWorkoutDraft } from "@/app/workouts/new/_hooks/use-stored-workout-draft";
import { WorkoutPersonalRecords } from "@/app/workouts/workout-personal-records";
import type { DashboardClientData, DashboardView } from "../dashboard-types";
import { countLabel } from "../dashboard-client.shared";
import styles from "../home.module.css";

function planSentence(
  exercise: DashboardClientData["overview"]["todaySession"][number],
  weightUnit: WeightUnit,
  completed: boolean,
) {
  const result = (weight: number | null, reps: number) =>
    `${weight === null ? "bodyweight" : formatWeightWithUnit(weight, weightUnit, { maximumFractionDigits: 1 })} × ${countLabel(reps, "rep")}`;
  const previous = exercise.lastReps !== null
    ? <>{exercise.lastPerformedLabel ? <>On <strong>{exercise.lastPerformedLabel}</strong></> : "Last session"}, your top set was <strong>{result(exercise.lastWeight, exercise.lastReps)}</strong>.</>
    : exercise.lastPerformedLabel
      ? <>You last logged this on <strong>{exercise.lastPerformedLabel}</strong>.</>
      : "No previous session logged.";
  const sets = countLabel(exercise.plannedSets, "set");
  const target = exercise.suggestedTopSet;
  const today = completed
    ? `Your plan calls for ${sets}.`
    : target && (target.confidence === "medium" || target.confidence === "high")
      ? <>Today, aim for <strong>{result(target.weight, target.reps)}</strong> on your top set, with {sets} planned.</>
      : `You have ${sets} planned today.`;
  return <>{previous} {today}</>;
}

export type DashboardOverviewViewProps = {
  overview: DashboardClientData["overview"];
  todayPlan: DashboardClientData["overview"]["todayPlan"];
  greetingName: string;
  weightUnit: WeightUnit;
  userId?: string;
  onNavigateToView: (view: DashboardView) => void;
};

const weekdayFormat = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" });
const dateFormat = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" });

export function DashboardOverviewView({ overview, todayPlan, greetingName, weightUnit, onNavigateToView, userId }: DashboardOverviewViewProps) {
  const draft = useStoredWorkoutDraft(weightUnit);
  const date = toDatabaseDateFromInput(overview.asOfDate);
  const hasPlan = todayPlan.workoutTypeSlug !== null && !todayPlan.isRestDay;
  const completed = overview.loggedWorkoutId;
  const plannedSets = overview.todaySession.reduce((sum, exercise) => sum + exercise.plannedSets, 0);
  const recordedDays = new Set(overview.activityDays.filter((day) => day.count > 0).map((day) => day.date)).size;
  const primary = draft
    ? { label: "Resume workout", href: "/workouts/new?from=dashboard" }
    : completed
      ? { label: "Open workout", href: `/workouts/${completed}?from=dashboard` }
      : { label: todayPlan.isRestDay ? "Log an unscheduled workout" : "Start workout", href: "/workouts/new?from=dashboard" };

  return (
    <div className={styles.home}>
      <div className={styles.dateRow}>
        <h1 className={styles.day}>{weekdayFormat.format(date)}</h1>
        <p className={styles.date}>{dateFormat.format(date)}<br />{date.getUTCFullYear()}</p>
      </div>

      <div className={styles.mainColumn}>
        <section className={styles.today} aria-label="Today's workout">
          <p className={styles.lead}>
            Hi, <strong>{greetingName}</strong>.<br />
            {draft ? <>You have a workout <strong>to finish.</strong></>
              : completed ? <>Your training is <strong>logged for today.</strong></>
                : todayPlan.isRestDay ? <>Today is a <strong>rest day.</strong></>
                  : hasPlan ? <>You have <strong>{todayPlan.workoutType}</strong> today.</>
                    : <>Your next workout <strong>starts here.</strong></>}
          </p>
          {!draft && !completed ? (
            <p className={styles.context}>
              {hasPlan ? <><strong>{countLabel(overview.todaySession.length, "exercise")}</strong> and <strong>{countLabel(plannedSets, "planned set")}</strong> from your split.</>
                  : todayPlan.isRestDay ? "No training is scheduled in your split today."
                    : "Choose a split, or log without one."}
            </p>
          ) : null}
          <Link href={primary.href} className={styles.primary} data-completed={Boolean(completed) && !draft}>
            <span>{primary.label}</span>
            {completed && !draft ? <Check size={19} strokeWidth={1.8} /> : <Play size={17} strokeWidth={1.8} />}
            <LinkPendingOverlay />
          </Link>
          {!hasPlan && !todayPlan.isRestDay && !completed && !draft ? (
            <button type="button" className={styles.quiet} onClick={() => onNavigateToView("split")}>Set up a split <ArrowRight size={16} /></button>
          ) : null}
        </section>
        {userId ? <WorkoutPersonalRecords userId={userId} weightUnit={weightUnit} /> : null}

        <section className={styles.activity} aria-label="Recorded activity">
          <div className={styles.sectionHead}>
            <h2>Recent activity</h2>
            <button type="button" className={styles.iconButton} aria-label="Browse workout history" onClick={() => onNavigateToView("workouts")}><ArrowUpRight size={20} strokeWidth={1.7} /></button>
          </div>
          <MonthlyActivityCalendar days={overview.activityDays} endDate={overview.asOfDate} />
          <p className={styles.activityNote}>{recordedDays ? `${countLabel(recordedDays, "day")} with a recorded workout in the past three months.` : "Your recorded training days will appear here."}</p>
        </section>

      </div>

      {hasPlan && overview.todaySession.length > 0 ? (
        <section className={styles.plan} aria-label="Today's exercises">
          <div className={styles.sectionHead}>
            <h2>Today&apos;s exercises</h2>
          </div>
          <div className={styles.planList}>
            {overview.todaySession.map((exercise) => (
              <div key={exercise.id} className={styles.exercise}>
                <h3 className={styles.exerciseName}>{exercise.name}</h3>
                <p className={styles.exerciseSentence}>{planSentence(exercise, weightUnit, Boolean(completed))}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
