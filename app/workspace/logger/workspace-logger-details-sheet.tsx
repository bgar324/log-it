"use client";

import { Input } from "@/app/components/workspace-ui/input";
import { Label } from "@/app/components/workspace-ui/label";
import { Button } from "@/app/components/workspace-ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/workspace-ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/app/components/workspace-ui/sheet";
import {
  formatDatabaseDateValue,
  getCurrentPacificDate,
} from "@/lib/workout-utils";

export type WorkspaceLoggerDetailsFields = {
  title: string;
  performedAt: string;
  workoutType: string;
  workoutTypeOptions: string[];
  /**
   * Edit mode owns the date and the workout type, because both are already
   * decided for a saved workout. A new workout takes its date from the day it
   * is being logged for and its type from the split, so those fields do not
   * exist there.
   */
  showEditFields: boolean;
  onTitleChange: (value: string) => void;
  onPerformedAtChange: (value: string) => void;
  onWorkoutTypeChange: (value: string) => void;
};

export type WorkspaceLoggerDetailsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * The sheet is portalled out of the form, so every native field states the
   * form it belongs to. That keeps validation and submission attached to the
   * logger's form wherever the sheet is rendered.
   */
  formId: string;
  fields: WorkspaceLoggerDetailsFields;
};

export function WorkspaceLoggerDetailsSheet({
  open,
  onOpenChange,
  formId,
  fields,
}: WorkspaceLoggerDetailsSheetProps) {
  const latestAllowedDate = formatDatabaseDateValue(getCurrentPacificDate());
  const hasWorkoutTypes = fields.workoutTypeOptions.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] gap-0 rounded-t-xl pb-[env(safe-area-inset-bottom)]"
      >
        <SheetHeader className="pr-14">
          <SheetTitle>Workout details</SheetTitle>
          <SheetDescription>
            {fields.showEditFields
              ? "Name this workout, and change the day or the type it was logged as."
              : "Name this workout. Its date and type come from the day you are logging."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="workspace-workout-title">Workout title</Label>
            <Input
              id="workspace-workout-title"
              form={formId}
              name="title"
              value={fields.title}
              placeholder="Push day"
              onChange={event => fields.onTitleChange(event.target.value)}
            />
          </div>

          {fields.showEditFields ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="workspace-workout-type">Workout type</Label>
              <Select
                name="workoutType"
                required
                disabled={!hasWorkoutTypes}
                value={fields.workoutType}
                onValueChange={fields.onWorkoutTypeChange}
              >
                <SelectTrigger id="workspace-workout-type" className="w-full">
                  <SelectValue placeholder="Select workout type" />
                </SelectTrigger>
                <SelectContent>
                  {fields.workoutTypeOptions.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasWorkoutTypes ? null : (
                <p className="text-xs text-muted-foreground">
                  Your split has no workout types yet, so this workout keeps the
                  type it was saved with.
                </p>
              )}
            </div>
          ) : null}

          {fields.showEditFields ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="workspace-workout-date">Workout date</Label>
              <Input
                id="workspace-workout-date"
                form={formId}
                name="performedAt"
                type="date"
                required
                value={fields.performedAt}
                max={latestAllowedDate}
                onChange={event =>
                  fields.onPerformedAtChange(event.target.value)
                }
              />
            </div>
          ) : null}
        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button type="button" size="lg">
              Done
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
