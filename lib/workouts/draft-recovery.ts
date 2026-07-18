type WorkoutDraftMetadata = {
  title: string;
  workoutType: string;
  performedAt: string;
};

type HydratedWorkoutDraft<TExercises, TCounters> = {
  exercises: TExercises;
  counters: TCounters;
};

// A recovered draft is an unfinished historical workout. Its date and workout
// type are part of that record; replacing them with today's split would turn
// yesterday's session into a falsely dated/mislabeled workout.
export function recoverWorkoutDraft<TExercises, TCounters>(
  snapshot: WorkoutDraftMetadata,
  hydrated: HydratedWorkoutDraft<TExercises, TCounters>,
) {
  return {
    title: snapshot.title,
    workoutType: snapshot.workoutType,
    performedAt: snapshot.performedAt,
    exercises: hydrated.exercises,
    counters: hydrated.counters,
  };
}
