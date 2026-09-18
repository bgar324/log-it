import { Card, CardContent, CardHeader } from "@/app/components/workspace-ui/card";
import { Skeleton } from "@/app/components/workspace-ui/skeleton";

/**
 * The detail skeletons, built from the shipped detail layouts rather than a
 * parallel set of sizes: the same card stack, the same row height, so nothing
 * jumps when the real content arrives. The body halves are used on their own by
 * the detail sheet, which already has its own title above them.
 */
function DetailHeadingSkeleton({
  titleWidth,
  sentenceWidth,
  metaWidth,
}: {
  titleWidth: string;
  sentenceWidth: string;
  metaWidth: string;
}) {
  return (
    <div>
      <Skeleton className={`h-7 ${titleWidth}`} />
      <Skeleton className={`mt-2.5 h-4 ${sentenceWidth}`} />
      <Skeleton className={`mt-2 h-3.5 ${metaWidth}`} />
    </div>
  );
}

export function WorkspaceWorkoutDetailBodySkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 3 }, (_, exerciseIndex) => (
        <Card key={exerciseIndex}>
          <CardHeader>
            <Skeleton className="h-4 w-[min(100%,14rem)]" />
            <Skeleton className="mt-1.5 h-3.5 w-[min(100%,11rem)]" />
          </CardHeader>
          <CardContent className="px-0">
            <div className="divide-y divide-foreground/10 border-t border-foreground/10">
              {Array.from({ length: 4 }, (_, setIndex) => (
                <div
                  key={setIndex}
                  className="flex min-h-[2.5rem] items-center gap-3 px-3 py-2"
                >
                  <Skeleton className="h-3 w-[2.6rem] shrink-0" />
                  <Skeleton className="h-3.5 w-[min(100%,8.4rem)]" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function WorkspaceWorkoutDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <DetailHeadingSkeleton
        titleWidth="w-[min(100%,20rem)]"
        sentenceWidth="w-[min(100%,17rem)]"
        metaWidth="w-[min(100%,12rem)]"
      />
      <WorkspaceWorkoutDetailBodySkeleton />
    </div>
  );
}

export function WorkspaceExerciseDetailBodySkeleton() {
  return (
    <div className="@container flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 @min-[56rem]:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-4 w-[9rem]" />
              <Skeleton className="mt-1.5 h-3.5 w-[min(100%,20rem)]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[15rem] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-[9rem]" />
          <Skeleton className="mt-1.5 h-3.5 w-[min(100%,15rem)]" />
        </CardHeader>
        <CardContent className="px-0">
          <div className="divide-y divide-foreground/10 border-t border-foreground/10">
            {/* One page of the session list, which pages five at a time. */}
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="flex min-h-[3.25rem] items-center gap-3 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-3.5 w-[6.4rem]" />
                  <Skeleton className="mt-1.5 h-3 w-[7.6rem]" />
                </div>
                <div className="shrink-0">
                  <Skeleton className="ml-auto h-3.5 w-[4.4rem]" />
                  <Skeleton className="mt-1.5 ml-auto h-3 w-[8.2rem]" />
                </div>
              </div>
            ))}
          </div>
          {/* The list ends in a pager once there is a second page; reserving it
              keeps the card from growing a row taller on arrival. */}
          <div className="flex items-center justify-between gap-3 px-3 pt-3">
            <Skeleton className="size-11 rounded-full" />
            <Skeleton className="h-3.5 w-[4.4rem]" />
            <Skeleton className="size-11 rounded-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function WorkspaceExerciseDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <DetailHeadingSkeleton
        titleWidth="w-[min(100%,18rem)]"
        sentenceWidth="w-[min(100%,21rem)]"
        metaWidth="w-[min(100%,16rem)]"
      />
      <WorkspaceExerciseDetailBodySkeleton />
    </div>
  );
}
