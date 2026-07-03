export function getWorkoutDataTag(userId: string) {
  return `workout-data:${userId}`;
}

export function getSplitDataTag(userId: string) {
  return `split-data:${userId}`;
}

export function getNutritionDataTag(userId: string) {
  return `nutrition-data:${userId}`;
}
