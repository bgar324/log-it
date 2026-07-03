import { requireSessionUser } from "@/lib/auth";
import { loadNutritionDashboard } from "@/lib/nutrition";

export async function loadNutritionSection(
  userId: string,
  weightUnit: Awaited<ReturnType<typeof requireSessionUser>>["preferredWeightUnit"],
  now: Date,
) {
  return {
    nutrition: await loadNutritionDashboard(userId, weightUnit, now),
  };
}
