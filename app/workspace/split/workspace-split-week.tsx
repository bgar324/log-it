"use client";

import { ArrowUpDown } from "lucide-react";
import { Button } from "@/app/components/workspace-ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/workspace-ui/card";
import {
  getSplitWeekdayLabel,
  isRestDayWorkoutTypeSlug,
  type SplitWeekdayValue,
  type WorkoutSplitDayTemplate,
} from "@/lib/workout-splits/shared";
import { describeDayLoad, describeTodayInWeek } from "./workspace-split.shared";

export type WorkspaceSplitWeekProps = {
  days: WorkoutSplitDayTemplate[];
  selectedWeekday: SplitWeekdayValue;
  todayWeekday: SplitWeekdayValue;
  isSaving: boolean;
  onSelectDay: (weekday: SplitWeekdayValue) => void;
  onReorder: () => void;
};

/**
 * The week as it stands: which workout each weekday holds and what it asks
 * for. Picking a day is how you edit it; the weekdays themselves never move,
 * so reordering is only about which weekday holds which workout.
 */
export function WorkspaceSplitWeek({
  days,
  selectedWeekday,
  todayWeekday,
  isSaving,
  onSelectDay,
  onReorder,
}: WorkspaceSplitWeekProps) {
  return (
    <Card aria-label="Your week" role="region">
      <CardHeader>
        <CardTitle>Week</CardTitle>
        <CardDescription>
          {describeTodayInWeek(days, todayWeekday)}
        </CardDescription>
        <CardAction>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-haspopup="dialog"
            disabled={isSaving || days.length < 2}
            onClick={onReorder}
          >
            <ArrowUpDown strokeWidth={1.5} />
            Move workouts
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="px-0">
        <ul className="list-none divide-y divide-foreground/10 border-y border-foreground/10">
          {days.map((day) => {
            const label = getSplitWeekdayLabel(day.weekday);
            const isToday = day.weekday === todayWeekday;
            const isRestDay = isRestDayWorkoutTypeSlug(day.workoutTypeSlug);
            const load = describeDayLoad(day);

            return (
              <li key={day.weekday}>
                <button
                  type="button"
                  data-split-day={day.weekday}
                  aria-current={
                    day.weekday === selectedWeekday ? "true" : undefined
                  }
                  aria-label={`${label}${isToday ? ", today" : ""}: ${
                    day.workoutType.trim() || "unnamed workout"
                  }, ${load}`}
                  className="flex min-h-[3.25rem] w-full items-center gap-3 px-3 py-2.5 text-left outline-none transition-colors hover:bg-muted focus-visible:bg-muted aria-[current=true]:bg-muted"
                  onClick={() => onSelectDay(day.weekday)}
                >
                  <span className="w-12 shrink-0 sm:w-24">
                    <span
                      aria-hidden="true"
                      className="block text-sm font-medium text-foreground"
                    >
                      <span className="sm:hidden">{label.slice(0, 3)}</span>
                      <span className="hidden sm:inline">{label}</span>
                    </span>
                    {isToday ? (
                      <span
                        aria-hidden="true"
                        className="mt-0.5 block text-xs text-muted-foreground"
                      >
                        Today
                      </span>
                    ) : null}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`min-w-0 flex-1 truncate text-sm ${
                      isRestDay ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {day.workoutType.trim() || "Name this workout"}
                  </span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-right text-xs text-muted-foreground tabular-nums"
                  >
                    {load}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </CardContent>

      <CardContent className="lg:hidden">
        <p className="text-xs text-muted-foreground">
          Tap a day to edit the workout and exercises it plans.
        </p>
      </CardContent>
    </Card>
  );
}
