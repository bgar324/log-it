import type { ExerciseDetailData } from "@/app/exercises/[exerciseKey]/exercise-detail.data";
import type { WeightUnit } from "@/lib/weight-unit";

/**
 * Everything the workspace shows about one exercise, already formatted. It is
 * `ExerciseDetailData` minus the session user, which is the one field that must
 * never cross the network to the detail sheet.
 */
export type WorkspaceExerciseDetailProjection = {
  displayName: string;
  summarySentence: string;
  summaryMeta: string;
  weightUnit: WeightUnit;
  chartSeries: ExerciseDetailData["chartSeries"];
  sessions: ExerciseDetailData["sessionBreakdownRows"];
};

export function toWorkspaceExerciseDetail(
  data: ExerciseDetailData,
): WorkspaceExerciseDetailProjection {
  return {
    displayName: data.displayName,
    summarySentence: data.summarySentence,
    summaryMeta: data.summaryMeta,
    weightUnit: data.weightUnit,
    chartSeries: data.chartSeries,
    sessions: data.sessionBreakdownRows,
  };
}
