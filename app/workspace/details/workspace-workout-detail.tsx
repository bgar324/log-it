import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/workspace-ui/card";
import type { WorkspaceWorkoutDetailProjection } from "./workspace-workout-detail.data";

export type WorkspaceWorkoutDetailProps = {
  detail: WorkspaceWorkoutDetailProjection;
};

/**
 * The exercise cards, without the page heading: the standalone page puts an h1
 * above them, the detail sheet puts its own title above them, and neither
 * should own a second copy of this list.
 */
export function WorkspaceWorkoutDetailBody({ detail }: WorkspaceWorkoutDetailProps) {
  return (
    <div className="flex flex-col gap-4">
      {detail.exercises.map((exercise) => (
        <Card key={exercise.id}>
          <CardHeader>
            <CardTitle>{exercise.name}</CardTitle>
            <CardDescription>{exercise.metaLine}</CardDescription>
          </CardHeader>

          <CardContent className="px-0">
            <div className="divide-y divide-foreground/10 border-t border-foreground/10">
              {exercise.sets.map((set) => (
                <div
                  key={set.id}
                  className="flex min-h-[2.5rem] items-center gap-3 px-3 py-2"
                >
                  <span className="w-[3.4rem] shrink-0 text-xs text-muted-foreground tabular-nums">
                    {set.orderLabel}
                  </span>
                  <span className="min-w-0 flex-1 text-sm text-foreground tabular-nums">
                    {set.detail}
                  </span>
                  {set.durationLabel ? (
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {set.durationLabel}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * One logged workout, read rather than edited: the title, what the session
 * added up to in a sentence, then one card per exercise with every set on its
 * own line. The workout type rides on the muted meta line instead of standing
 * above the title as an eyebrow.
 */
export function WorkspaceWorkoutDetail({ detail }: WorkspaceWorkoutDetailProps) {
  const typePrefix =
    detail.workoutType && detail.workoutType !== detail.title
      ? `${detail.workoutType} · `
      : "";

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl leading-snug font-medium tracking-tight text-foreground">
          {detail.title}
        </h1>
        <p className="mt-1.5 text-[0.95rem] leading-relaxed text-foreground">
          {detail.summarySentence}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {typePrefix}
          {detail.summaryMeta}
        </p>
      </header>

      <WorkspaceWorkoutDetailBody detail={detail} />
    </div>
  );
}
