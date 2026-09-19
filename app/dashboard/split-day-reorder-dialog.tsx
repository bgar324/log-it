"use client";

import { MoveReorderDialog } from "@/app/components/move-reorder-dialog";
import {
  SPLIT_WEEKDAYS,
  getSplitWeekdayIndex,
  getSplitWeekdayLabel,
  isRestDayWorkoutTypeSlug,
  type SplitWeekdayValue,
  type WorkoutSplitDayTemplate,
} from "@/lib/workout-splits/shared";

type SplitDayReorderDialogProps = {
  days: WorkoutSplitDayTemplate[];
  open: boolean;
  onCancel: () => void;
  onSave: (orderedWeekdays: SplitWeekdayValue[]) => void;
};

const slotLabels = SPLIT_WEEKDAYS.map(getSplitWeekdayLabel);

export function SplitDayReorderDialog({ days, open, onCancel, onSave }: SplitDayReorderDialogProps) {
  const items = [...days]
    .sort((left, right) => getSplitWeekdayIndex(left.weekday) - getSplitWeekdayIndex(right.weekday))
    .map((day, index) => {
      const rest = isRestDayWorkoutTypeSlug(day.workoutTypeSlug);
      return {
        id: day.weekday,
        title: day.workoutType.trim() || (rest ? "Rest" : `Day ${index + 1}`),
        meta: rest ? "Rest day" : `${day.exercises.length} ${day.exercises.length === 1 ? "exercise" : "exercises"}`,
      };
    });
  return <MoveReorderDialog kind="workout" items={items} slotLabels={slotLabels} open={open} onCancel={onCancel} onSave={onSave} />;
}
