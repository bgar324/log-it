"use client";

import { GripVertical } from "lucide-react";
import {
  getSplitWeekdayLabel,
  type WorkoutSplitDayTemplate,
} from "@/lib/workout-splits/shared";
import splitStyles from "./split-system.module.css";

type SplitDayCardProps = {
  day: WorkoutSplitDayTemplate;
  isSelected: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
};

export function SplitDayCard({
  day,
  isSelected,
  isDragging,
  isDropTarget,
  onSelect,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: SplitDayCardProps) {
  const totalSets = day.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);

  return (
    <button
      type="button"
      draggable={true}
      className={`${splitStyles.splitDayCard} ${
        isSelected ? splitStyles.splitDayCardActive : ""
      } ${isDragging ? splitStyles.splitDayCardDragging : ""} ${
        isDropTarget ? splitStyles.splitDayCardDropTarget : ""
      }`}
      onClick={onSelect}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", day.weekday);
        onDragStart();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        onDragOver();
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}
      onDragEnd={onDragEnd}
    >
      <div className={splitStyles.splitDayHeader}>
        <div className={splitStyles.splitDayLead}>
          <span
            className={splitStyles.splitDayHandle}
            aria-hidden="true"
            title="Drag to reorder this day"
          >
            <GripVertical className={splitStyles.inlineIcon} aria-hidden="true" strokeWidth={1.9} />
          </span>
          <span className={splitStyles.splitDayWeekday}>
            {getSplitWeekdayLabel(day.weekday)}
          </span>
        </div>
        <span className={splitStyles.splitDayMeta}>{day.exercises.length} exercises</span>
      </div>
      <strong className={splitStyles.splitDayTitle}>{day.workoutType}</strong>
      <p className={splitStyles.splitDayStats}>{totalSets} planned sets</p>
    </button>
  );
}
