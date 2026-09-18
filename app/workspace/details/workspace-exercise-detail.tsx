import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/workspace-ui/card";
import { ExerciseDetailChart } from "@/app/exercises/[exerciseKey]/exercise-detail-chart";
import { WorkspaceSessionBreakdownList } from "./workspace-session-breakdown-list";
import type { WorkspaceExerciseDetailProjection } from "./workspace-exercise-detail.data";

export type WorkspaceExerciseDetailProps = {
  detail: WorkspaceExerciseDetailProjection;
};

/**
 * The charts and the session list, without the page heading. The two charts sit
 * side by side when the container is wide enough, which is a container query
 * rather than a viewport one: the same body renders in a 560px sheet on a wide
 * screen, where a viewport breakpoint would give it two cramped columns.
 *
 * The charts are the shipped chart component unchanged — its colours are inline
 * recharts strings in the `--text`/`--muted` vocabulary, which the
 * `workspace-chart-theme` wrapper maps onto the workspace's own tokens.
 */
export function WorkspaceExerciseDetailBody({ detail }: WorkspaceExerciseDetailProps) {
  return (
    <div className="@container flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 @min-[56rem]:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weight over time</CardTitle>
            <CardDescription>
              Best top-set weight each time this exercise was trained.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="workspace-chart-theme">
              <ExerciseDetailChart
                series={detail.chartSeries}
                metric="weight"
                weightUnit={detail.weightUnit}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Strength trend</CardTitle>
            <CardDescription>
              Top-set estimated 1RM, so extra reps at the same weight still
              count as progress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="workspace-chart-theme">
              <ExerciseDetailChart
                series={detail.chartSeries}
                metric="strength"
                weightUnit={detail.weightUnit}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session breakdown</CardTitle>
          <CardDescription>
            Every session this exercise appeared in, newest first.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <WorkspaceSessionBreakdownList sessions={detail.sessions} />
        </CardContent>
      </Card>
    </div>
  );
}

/** One exercise's whole history, as its own page. */
export function WorkspaceExerciseDetail({ detail }: WorkspaceExerciseDetailProps) {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl leading-snug font-medium tracking-tight text-foreground">
          {detail.displayName}
        </h1>
        <p className="mt-1.5 text-[0.95rem] leading-relaxed text-foreground">
          {detail.summarySentence}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{detail.summaryMeta}</p>
      </header>

      <WorkspaceExerciseDetailBody detail={detail} />
    </div>
  );
}
