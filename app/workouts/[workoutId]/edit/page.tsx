import { notFound } from "next/navigation";
import { WorkoutLogger, type WorkoutLoggerInitialData } from "@/app/workouts/new/workout-logger";
import { requireSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type EditWorkoutPageParams = Promise<{ workoutId: string }>;

function toWeightValue(value: { toNumber: () => number } | number | null) {
  if (value === null) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  return value.toNumber();
}

function toWeightInputValue(value: { toNumber: () => number } | number | null) {
  const parsed = toWeightValue(value);

  if (parsed === null) {
    return "";
  }

  return `${parsed}`;
}

export default async function EditWorkoutPage({
  params,
}: {
  params: EditWorkoutPageParams;
}) {
  const { workoutId } = await params;
  const user = await requireSessionUser();

  const workout = await prisma.workoutLog.findFirst({
    where: {
      id: workoutId,
      userId: user.id,
    },
    select: {
      id: true,
      title: true,
      performedAt: true,
      exercises: {
        orderBy: {
          order: "asc",
        },
        select: {
          name: true,
          sets: {
            orderBy: {
              order: "asc",
            },
            select: {
              reps: true,
              weightLb: true,
            },
          },
        },
      },
    },
  });

  if (!workout) {
    notFound();
  }

  const initialData: WorkoutLoggerInitialData = {
    title: workout.title,
    performedAt: workout.performedAt.toISOString(),
    exercises: workout.exercises.map((exercise) => ({
      name: exercise.name,
      sets: exercise.sets.map((setItem) => ({
        reps: `${setItem.reps}`,
        weightLb: toWeightInputValue(setItem.weightLb),
      })),
    })),
  };

  return (
    <WorkoutLogger
      mode="edit"
      workoutId={workout.id}
      initialData={initialData}
    />
  );
}
