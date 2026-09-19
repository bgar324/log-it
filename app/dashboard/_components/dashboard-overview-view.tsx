"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Play } from "lucide-react";
import { formatWeightWithUnit, type WeightUnit } from "@/lib/weight-unit";
import { toDatabaseDateFromInput } from "@/lib/workout-utils";
import { LinkPendingOverlay } from "@/app/components/link-pending";
import { MonthlyActivityCalendar } from "@/app/components/activity-calendar";
import { useStoredWorkoutDraft } from "@/app/workouts/new/_hooks/use-stored-workout-draft";
import type { DashboardClientData, DashboardView } from "../dashboard-types";
import { countLabel } from "../dashboard-client.shared";
import styles from "../home.module.css";

export type DashboardOverviewViewProps = {
  overview: DashboardClientData["overview"];
  todayPlan: DashboardClientData["overview"]["todayPlan"];
  greetingName: string;
  weightUnit: WeightUnit;
  workouts?: DashboardClientData["workouts"];
  onNavigateToView: (view: DashboardView) => void;
};

const weekdayFormat = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" });
const dateFormat = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" });

export function DashboardOverviewView({ overview, todayPlan, greetingName, weightUnit, workouts = [], onNavigateToView }: DashboardOverviewViewProps) {
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
  const latest = workouts[0];

  return (
    <div className={styles.home}>
      <div className={styles.dateRow}>
        <h1 className={styles.day}>{weekdayFormat.format(date)}<span className={styles.todayDot} /></h1>
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
          <p className={styles.context}>
            {draft ? draft.performedAt === overview.asOfDate ? "Your unfinished session is on this device." : `Unfinished session from ${dateFormat.format(toDatabaseDateFromInput(draft.performedAt))}.`
              : completed ? "Your session is here whenever you want to look back."
                : hasPlan ? <><strong>{countLabel(overview.todaySession.length, "exercise")}</strong> and <strong>{countLabel(plannedSets, "planned set")}</strong> from your split.</>
                  : todayPlan.isRestDay ? "No training is scheduled in your split today."
                    : "Choose a split, or log without one."}
          </p>
          <Link href={primary.href} className={styles.primary}>
            <span>{primary.label}</span>
            {completed && !draft ? <Check size={19} strokeWidth={1.8} /> : <Play size={17} strokeWidth={1.8} />}
            <LinkPendingOverlay />
          </Link>
          {!hasPlan && !todayPlan.isRestDay && !completed && !draft ? (
            <button type="button" className={styles.quiet} onClick={() => onNavigateToView("split")}>Set up a split <ArrowRight size={16} /></button>
          ) : null}
        </section>

        <section className={styles.activity} aria-label="Recorded activity">
          <div className={styles.sectionHead}>
            <h2>Your rhythm</h2>
            <button type="button" className={styles.iconButton} aria-label="Browse workout history" onClick={() => onNavigateToView("workouts")}><ArrowUpRight size={20} strokeWidth={1.7} /></button>
          </div>
          <MonthlyActivityCalendar days={overview.activityDays} endDate={overview.asOfDate} />
          <p className={styles.activityNote}>{recordedDays ? `${countLabel(recordedDays, "day")} with a recorded workout in the past three months.` : "Your recorded training days will appear here."}</p>
        </section>

        {latest ? (
          <Link href={`/workouts/${latest.id}?from=dashboard`} className={styles.lastSession} prefetch={false}>
            <span><span className={styles.secondary}>Last session</span><strong>{latest.title || latest.workoutType || "Workout"}</strong></span>
            <span className={styles.lastDate}>{latest.performedAtLabel}<ArrowUpRight size={18} /></span>
            <LinkPendingOverlay />
          </Link>
        ) : null}
      </div>

      {hasPlan && overview.todaySession.length > 0 ? (
        <section className={styles.plan} aria-label="Today's exercises">
          <div className={styles.sectionHead}>
            <h2>On the plan</h2>
            <span className={styles.secondary}>{todayPlan.workoutType}</span>
          </div>
          <div className={styles.planList}>
            {overview.todaySession.map((exercise, index) => (
              <div key={exercise.id} className={styles.exercise}>
                <span className={styles.ordinal}>{String(index + 1).padStart(2, "0")}</span>
                <div className={styles.exerciseIdentity}><p>{exercise.name}</p><span>{countLabel(exercise.plannedSets, "set")}</span></div>
                <span className={styles.lastResult}>
                  {exercise.lastWeight !== null ? formatWeightWithUnit(exercise.lastWeight, weightUnit, { maximumFractionDigits: 0 }) : exercise.lastPerformedLabel ? "Bodyweight" : "First time"}
                  {exercise.lastReps !== null ? <small>× {exercise.lastReps}</small> : null}
                </span>
              </div>
            ))}
          </div>
          <button type="button" className={styles.planLink} onClick={() => onNavigateToView("split")}>View your split <ArrowRight size={17} /></button>
        </section>
      ) : null}
    </div>
  );
}
