-- Backfill bestE1rmLb for exercise summaries built before the column existed.
-- Recomputes the Epley estimated 1RM per exercise, crediting the workout's
-- tracked body weight for bodyweight sets (mirrors buildExerciseSummaryRecords).
UPDATE "public"."ExerciseSummary" es
SET "bestE1rmLb" = COALESCE(sub.best_e1rm, 0)
FROM (
  SELECT
    wl."userId" AS user_id,
    we."normalizedName" AS normalized_name,
    MAX(
      CASE
        WHEN ws.reps > 0 THEN
          (CASE
             WHEN ws."weightLb" IS NOT NULL AND ws."weightLb" > 0 THEN ws."weightLb"
             ELSE COALESCE(wl."bodyWeightLb", 0)
           END) * (1 + ws.reps / 30.0)
        ELSE 0
      END
    ) AS best_e1rm
  FROM "public"."WorkoutExercise" we
  JOIN "public"."WorkoutLog" wl ON wl."id" = we."workoutLogId"
  JOIN "public"."WorkoutSet" ws ON ws."workoutExerciseId" = we."id"
  WHERE we."normalizedName" <> ''
  GROUP BY wl."userId", we."normalizedName"
) sub
WHERE es."userId" = sub.user_id
  AND es."normalizedName" = sub.normalized_name;
