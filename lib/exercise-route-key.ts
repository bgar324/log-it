import { createHash } from "node:crypto";

function toUuidLike(hex: string) {
  const value = hex.slice(0, 32).padEnd(32, "0");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20, 32)}`;
}

export function toExerciseRouteKey(normalizedExerciseName: string) {
  const digest = createHash("sha256").update(normalizedExerciseName).digest("hex");
  return toUuidLike(digest);
}

export function isUuidLikeKey(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
