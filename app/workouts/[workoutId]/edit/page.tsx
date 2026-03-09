import { notFound } from "next/navigation";
import { WorkoutLogger, type WorkoutLoggerInitialData } from "@/app/workouts/new/workout-logger";
import { requireSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatWeightInputValueFromPounds, toWeightNumber } from "@/lib/weight-unit";

type EditWorkoutPageParams = Promise<{ workoutId: string }>;

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
        weightLb: formatWeightInputValueFromPounds(
          toWeightNumber(setItem.weightLb),
          user.preferredWeightUnit,
        ),
      })),
    })),
  };

  return (
    <WorkoutLogger
      mode="edit"
      workoutId={workout.id}
      initialData={initialData}
      weightUnit={user.preferredWeightUnit}
    />
  );
}
