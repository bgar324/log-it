"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/workspace-ui/alert-dialog";
import { Button } from "@/app/components/workspace-ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/workspace-ui/card";
import { Input } from "@/app/components/workspace-ui/input";
import { Label } from "@/app/components/workspace-ui/label";
import {
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/app/components/workspace-ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/workspace-ui/tabs";
import {
  getSplitWeekdayLabel,
  isRestDayWorkoutTypeSlug,
  isSplitWeekday,
  type SplitWeekdayValue,
  type WorkoutSplitDayTemplate,
} from "@/lib/workout-splits/shared";
import { WorkspaceSplitExerciseList } from "./workspace-split-exercise-list";
import { describeDayPlan } from "./workspace-split.shared";

export type WorkspaceSplitDayEditorProps = {
  day: WorkoutSplitDayTemplate;
  days: WorkoutSplitDayTemplate[];
  todayWeekday: SplitWeekdayValue;
  searchResults: Record<string, string[]>;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  /** True for a plan the server has never stored: its first Save creates it. */
  isUnsavedPlan: boolean;
  /** "sheet" is the phone placement: it owns the heading and a way back. */
  variant: "inline" | "sheet";
  onSelectWeekday: (weekday: SplitWeekdayValue) => void;
  onWorkoutTypeChange: (value: string) => void;
  onExerciseNameChange: (exerciseIndex: number, value: string) => void;
  onExerciseNameFocus: (exerciseIndex: number, value: string) => void;
  onExerciseNameBlur: (exerciseIndex: number, value: string) => void;
  onApplyExerciseSearchResult: (
    exerciseIndex: number,
    suggestion: string,
  ) => void;
  onExerciseSetsChange: (exerciseIndex: number, value: number) => void;
  onAddExercise: () => void;
  onRemoveExercise: (exerciseIndex: number) => void;
  onReorderExercises: (orderedExerciseOrders: number[]) => void;
  /** Resolves true only once the server has the day. */
  onSave: () => Promise<boolean>;
  onDiscard: () => void;
  onClose?: () => void;
};

type EditorPrompt =
  | { kind: "remove"; order: number; label: string }
  | { kind: "discard" }
  | { kind: "close" };

/**
 * One day of the plan: which workout it is, the exercises it asks for, and how
 * many sets each one wants. The same component is the phone sheet and the
 * desktop column, so the week never has two copies of this form holding
 * different values. Edits are local until Save, and every way out of a dirty
 * day asks first.
 */
export function WorkspaceSplitDayEditor({
  day,
  days,
  todayWeekday,
  searchResults,
  isSaving,
  hasUnsavedChanges,
  isUnsavedPlan,
  variant,
  onSelectWeekday,
  onWorkoutTypeChange,
  onExerciseNameChange,
  onExerciseNameFocus,
  onExerciseNameBlur,
  onApplyExerciseSearchResult,
  onExerciseSetsChange,
  onAddExercise,
  onRemoveExercise,
  onReorderExercises,
  onSave,
  onDiscard,
  onClose,
}: WorkspaceSplitDayEditorProps) {
  const [prompt, setPrompt] = useState<EditorPrompt | null>(null);
  // Kept apart from `prompt` so a closing dialog still has its words.
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const weekdayLabel = getSplitWeekdayLabel(day.weekday);
  const isRestDay = isRestDayWorkoutTypeSlug(day.workoutTypeSlug);
  const isToday = day.weekday === todayWeekday;
  const canSave = !isSaving && (hasUnsavedChanges || isUnsavedPlan);
  const saveHint = isSaving
    ? "Saving your plan…"
    : hasUnsavedChanges
      ? "Unsaved changes."
      : isUnsavedPlan
        ? "This plan has never been saved."
        : "Everything here is saved.";

  function requestRemoveExercise(exerciseIndex: number) {
    const exercise = day.exercises[exerciseIndex];

    if (!exercise) {
      return;
    }

    const label = exercise.exerciseDisplayName.trim();

    // Nothing typed yet: confirming an empty row is pure friction.
    if (!label) {
      onRemoveExercise(exerciseIndex);
      return;
    }

    setPrompt({ kind: "remove", order: exercise.order, label });
    setIsPromptOpen(true);
  }

  function requestClose() {
    if (isSaving) {
      return;
    }

    if (hasUnsavedChanges) {
      setPrompt({ kind: "close" });
      setIsPromptOpen(true);
      return;
    }

    onClose?.();
  }

  function confirmPrompt(resolution: "save" | "discard" | "remove") {
    setIsPromptOpen(false);

    if (resolution === "remove") {
      if (prompt?.kind !== "remove") {
        return;
      }

      // Resolve by order, not by the index captured when the prompt opened.
      const index = day.exercises.findIndex(
        (exercise) => exercise.order === prompt.order,
      );

      if (index !== -1) {
        onRemoveExercise(index);
      }

      return;
    }

    if (resolution === "discard") {
      onDiscard();

      if (prompt?.kind === "close") {
        onClose?.();
      }

      return;
    }

    void onSave().then((saved) => {
      if (saved && prompt?.kind === "close") {
        onClose?.();
      }
    });
  }

  const dayForm = (
    <Tabs
      value={day.weekday}
      onValueChange={(next) => {
        if (isSplitWeekday(next)) {
          onSelectWeekday(next);
        }
      }}
      className="min-h-0 flex-1 gap-0"
    >
      <TabsList
        variant="card"
        activeValue={day.weekday}
        aria-label="Day of the week"
        className="mx-4 grid w-auto shrink-0 grid-cols-7 gap-0.5 p-0 group-data-horizontal/tabs:h-11"
      >
        {days.map((item) => {
          const label = getSplitWeekdayLabel(item.weekday);

          return (
            <TabsTrigger
              key={item.weekday}
              value={item.weekday}
              aria-label={`${label}${
                item.weekday === todayWeekday ? ", today" : ""
              }`}
              disabled={isSaving}
              className="flex-col gap-0.5 px-0"
            >
              <span aria-hidden="true">{label.slice(0, 3)}</span>
              {item.weekday === todayWeekday ? (
                <span
                  aria-hidden="true"
                  className="size-1 rounded-full bg-primary"
                />
              ) : null}
            </TabsTrigger>
          );
        })}
      </TabsList>

      <TabsContent value={day.weekday} className="flex min-h-0 flex-1 flex-col">
        <fieldset
          key={day.weekday}
          disabled={isSaving}
          aria-busy={isSaving}
          className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 motion-safe:animate-in motion-safe:fade-in-90 motion-safe:duration-150 motion-safe:ease-out"
        >
          <div className="space-y-1.5">
            <Label htmlFor="workspace-split-workout-type">Workout</Label>
            <Input
              id="workspace-split-workout-type"
              value={day.workoutType}
              onChange={(event) => onWorkoutTypeChange(event.target.value)}
              autoCapitalize="words"
              placeholder="Push"
            />
            <p className="text-xs text-muted-foreground">
              Call it Rest to make {weekdayLabel} a recovery day.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-medium text-foreground">Exercises</h4>
              {isRestDay ? null : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onAddExercise}
                >
                  <Plus strokeWidth={1.5} />
                  Add exercise
                </Button>
              )}
            </div>

            {isRestDay ? (
              <p className="text-sm text-muted-foreground">
                {weekdayLabel} is a rest day, so it plans no exercises. Name a
                workout above to give it some.
              </p>
            ) : day.exercises.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing planned yet. Add the first movement you want to do on{" "}
                {weekdayLabel}.
              </p>
            ) : (
              <>
                <p className="pr-10 text-right text-xs text-muted-foreground">
                  Sets
                </p>
                <WorkspaceSplitExerciseList
                  weekday={day.weekday}
                  exercises={day.exercises}
                  searchResults={searchResults}
                  onNameChange={onExerciseNameChange}
                  onNameFocus={onExerciseNameFocus}
                  onNameBlur={onExerciseNameBlur}
                  onApplySearchResult={onApplyExerciseSearchResult}
                  onSetsChange={onExerciseSetsChange}
                  onRemove={requestRemoveExercise}
                  onReorder={onReorderExercises}
                />
                <p className="text-xs text-muted-foreground">
                  Drag a handle to reorder. Saving the day sends the new order
                  to your logger.
                </p>
              </>
            )}
          </div>
        </fieldset>
      </TabsContent>
    </Tabs>
  );

  const actions = (
    <>
      <p
        role="status"
        data-unsaved={hasUnsavedChanges}
        className="text-xs text-muted-foreground"
      >
        {saveHint}
      </p>
      <div className="flex items-center gap-2">
        {hasUnsavedChanges ? (
          <Button
            type="button"
            variant="ghost"
            disabled={isSaving}
            onClick={() => {
              setPrompt({ kind: "discard" });
              setIsPromptOpen(true);
            }}
          >
            Discard
          </Button>
        ) : null}
        {variant === "sheet" ? (
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={requestClose}
          >
            Back to week
          </Button>
        ) : null}
        <Button type="button" disabled={!canSave} onClick={() => void onSave()}>
          {isSaving ? "Saving…" : "Save day"}
        </Button>
      </div>
    </>
  );

  const prompts = (
    <AlertDialog
      open={isPromptOpen}
      onOpenChange={(next) => {
        if (!next) {
          setIsPromptOpen(false);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {prompt?.kind === "remove"
              ? `Remove ${prompt.label}?`
              : prompt?.kind === "discard"
                ? `Discard your changes to ${weekdayLabel}?`
                : "You have unsaved changes"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {prompt?.kind === "remove"
              ? `It leaves ${weekdayLabel} as soon as you save the day.`
              : prompt?.kind === "discard"
                ? "This plan goes back to the version your account already has."
                : `Your changes to ${weekdayLabel} are not saved. Save them before you leave the day, or throw them away.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {prompt?.kind === "remove" ? "Keep it" : "Keep editing"}
          </AlertDialogCancel>
          {prompt?.kind === "remove" ? (
            <AlertDialogAction
              variant="destructive"
              onClick={() => confirmPrompt("remove")}
            >
              Remove exercise
            </AlertDialogAction>
          ) : (
            <AlertDialogAction
              variant="destructive"
              onClick={() => confirmPrompt("discard")}
            >
              Discard changes
            </AlertDialogAction>
          )}
          {prompt?.kind === "close" ? (
            <AlertDialogAction onClick={() => confirmPrompt("save")}>
              Save and close
            </AlertDialogAction>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (variant === "sheet") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <SheetHeader className="relative shrink-0 border-b border-foreground/10 pr-14">
          <SheetTitle>{weekdayLabel}</SheetTitle>
          <SheetDescription>{describeDayPlan(day, isToday)}</SheetDescription>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Back to the week"
            className="absolute top-3 right-3 text-muted-foreground"
            disabled={isSaving}
            onClick={requestClose}
          >
            <X strokeWidth={1.5} />
          </Button>
        </SheetHeader>

        {dayForm}

        <SheetFooter className="shrink-0 flex-row flex-wrap items-center justify-between gap-2 border-t border-foreground/10 bg-muted/50">
          {actions}
        </SheetFooter>

        {prompts}
      </div>
    );
  }

  return (
    <Card
      role="region"
      aria-label={`${weekdayLabel} in this plan`}
      className="max-h-[calc(100svh-12rem)] min-h-0"
    >
      <CardHeader>
        <CardTitle>{weekdayLabel}</CardTitle>
        <CardDescription>{describeDayPlan(day, isToday)}</CardDescription>
      </CardHeader>

      {dayForm}

      <CardFooter className="flex-wrap justify-between gap-2">
        {actions}
      </CardFooter>

      {prompts}
    </Card>
  );
}
