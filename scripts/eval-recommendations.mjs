import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

const require = createRequire(import.meta.url);
const { predictExercisePerformance, findAnchorSet, computeSetStrength } = require("../.tests-dist/lib/workouts/prediction.js");
const { convertStoredWeightToDisplay, roundStoredWeightToGymIncrement } = require("../.tests-dist/lib/weight-unit.js");
const args = process.argv.slice(2);
let database = false;
let output;
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--database") database = true;
  else if (args[i] === "--output" && args[i + 1]) output = args[++i];
  else throw new Error(`Unknown or incomplete argument: ${args[i]}`);
}

function syntheticSeries() {
  const series = [];
  for (const scenario of ["stable", "progression", "regression", "position", "gap", "regime-change", "bodyweight"]) {
    for (let seed = 1; seed <= 12; seed += 1) {
      let day = 0;
      const sessions = [];
      for (let i = 0; i < 90; i += 1) {
        const gap = scenario === "gap" ? [3, 7, 14, 4][(i + seed) % 4] : 4;
        day += gap;
        const position = scenario === "position" ? 1 + (i + seed) % 5 : 2;
        const noise = Math.sin(i * 1.73 + seed) * 1.2;
        const baseline = 90 + seed * 8;
        let weight = baseline + noise;
        if (scenario === "progression") weight += i * 1.5;
        if (scenario === "regression") weight += (90 - i) * 1.5;
        if (scenario === "position") weight -= position * 5;
        if (scenario === "gap") weight -= gap * 0.9;
        if (scenario === "regime-change") weight += i < 62 ? i * 1.5 : 93 - (i - 62) * 2;
        const reps = scenario === "bodyweight" ? Math.round(8 + i * 0.35 + seed / 3) : 8;
        sessions.push({
          workoutId: `synthetic-${i}`,
          workoutTitle: "",
          performedAt: new Date(Date.UTC(2024, 0, 1 + day)),
          exerciseOrder: position,
          sets: [
            { setIndex: 1, weightLb: scenario === "bodyweight" ? null : Math.round(weight / 5) * 5, reps },
            { setIndex: 2, weightLb: scenario === "bodyweight" ? null : Math.round((weight - 5) / 5) * 5, reps: Math.max(1, reps - 1) },
          ],
        });
      }
      series.push({ cohort: scenario, sessions });
    }
  }
  return { series, users: null, dataSource: "deterministic synthetic, not evidence of real-user accuracy" };
}

async function databaseSeries() {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  try {
    // No records or identities leave this process. PostgreSQL enforces read-only access.
    const rows = await prisma.$transaction(async tx => {
      await tx.$executeRaw`SET TRANSACTION READ ONLY`;
      return tx.$queryRaw`
        WITH recent AS (
          SELECT we.id, we."normalizedName", we."order" AS position,
            wl."userId", wl.id AS "workoutId", wl."performedAt",
            DENSE_RANK() OVER (
              PARTITION BY wl."userId", we."normalizedName"
              ORDER BY wl."performedAt" DESC, wl.id DESC
            ) AS recency
          FROM "WorkoutExercise" we JOIN "WorkoutLog" wl ON wl.id = we."workoutLogId"
          WHERE wl.status = 'COMPLETED' AND wl."performedAt" <= CURRENT_DATE
        )
        SELECT r."userId", r."normalizedName", r."workoutId", r."performedAt", r.position,
          s."order", s.reps, s."weightLb"::double precision AS weight
        FROM recent r JOIN "WorkoutSet" s ON s."workoutExerciseId" = r.id
        WHERE r.recency <= 90
        ORDER BY r."userId", r."normalizedName", r."performedAt", r."workoutId", r.position, s."order"
      `;
    }, { timeout: 60_000 });
    const groups = new Map();
    const users = new Set();
    for (const row of rows) {
      users.add(row.userId);
      const key = JSON.stringify([row.userId, row.normalizedName]);
      let group = groups.get(key);
      if (!group) { group = new Map(); groups.set(key, group); }
      let session = group.get(row.workoutId);
      if (!session) {
        session = { workoutId: row.workoutId, workoutTitle: "", performedAt: row.performedAt, exerciseOrder: row.position, sets: [] };
        group.set(row.workoutId, session);
      }
      if (Number.isInteger(row.reps) && row.reps > 0 && (row.weight === null || Number.isFinite(row.weight) && row.weight > 0)) {
        session.sets.push({ setIndex: session.sets.length + 1, reps: row.reps, weightLb: row.weight });
      }
    }
    return {
      series: Array.from(groups.values(), group => ({ cohort: "recorded", sessions: Array.from(group.values()).filter(session => session.sets.length > 0) })),
      users: users.size,
      dataSource: "recorded completed workouts, read-only retrospective replay",
    };
  } finally { await prisma.$disconnect(); }
}

function accumulator() {
  return { targets: 0, ridge: 0, weighted: 0, bodyweight: 0, relativeError: 0, repeatRelativeError: 0, weightError: 0, repeatWeightError: 0, repError: 0, repeatRepError: 0 };
}

function report(a) {
  return {
    targets: a.targets,
    ridgeTargets: a.ridge,
    ridgeRate: a.targets ? a.ridge / a.targets : 0,
    strengthRelativeMae: a.targets ? a.relativeError / a.targets : null,
    repeatStrengthRelativeMae: a.targets ? a.repeatRelativeError / a.targets : null,
    weightedTargets: a.weighted,
    weightMaeLb: a.weighted ? a.weightError / a.weighted : null,
    repeatWeightMaeLb: a.weighted ? a.repeatWeightError / a.weighted : null,
    bodyweightTargets: a.bodyweight,
    bodyweightRepMae: a.bodyweight ? a.repError / a.bodyweight : null,
    repeatBodyweightRepMae: a.bodyweight ? a.repeatRepError / a.bodyweight : null,
  };
}

function evaluate(data) {
  const total = accumulator();
  const cohorts = new Map();
  let evaluatedSeries = 0;
  let skippedModeChanges = 0;
  let latencyMs = 0;
  let maxLatencyMs = 0;
  const seriesErrors = [];
  for (const { cohort, sessions: raw } of data.series) {
    // Mirror production's deterministic one-workout-per-date training policy.
    const byDay = new Map();
    for (const session of [...raw].sort((a, b) => a.workoutId.localeCompare(b.workoutId))) {
      byDay.set(session.performedAt.toISOString().slice(0, 10), session);
    }
    const sessions = Array.from(byDay.values()).sort((a, b) => a.performedAt - b.performedAt);
    if (sessions.length < 3) continue;
    const seriesMetrics = accumulator();
    const start = Math.max(2, Math.floor(sessions.length * 2 / 3));
    for (let i = start; i < sessions.length; i += 1) {
      const target = sessions[i];
      const actual = findAnchorSet(target);
      const previous = findAnchorSet(sessions[i - 1]);
      if (!actual || !previous || actual.kind !== previous.kind) { skippedModeChanges += 1; continue; }
      const options = { sessions: sessions.slice(Math.max(0, i - 60), i), performedAt: target.performedAt, currentPosition: target.exerciseOrder ?? 1, setCount: 3, weightUnit: "LB" };
      const begin = performance.now();
      const prediction = predictExercisePerformance(options);
      const elapsed = performance.now() - begin;
      latencyMs += elapsed;
      maxLatencyMs = Math.max(maxLatencyMs, elapsed);
      assert.ok(prediction, "Eligible history must return a prediction");
      const top = prediction.predictedSets[0];
      assert.ok(top.reps > 0 && Number.isInteger(top.reps));
      assert.ok(top.weightLb === null || Number.isFinite(top.weightLb) && top.weightLb > 0);
      // Exercise the real sanitization path with held-out labels deliberately present.
      assert.deepEqual(predictExercisePerformance({ ...options, sessions: [...options.sessions, ...sessions.slice(i)] }), prediction, "Future/target labels leaked into inference");
      for (const unit of ["LB", "KG"]) {
        const bounded = unit === "LB" ? prediction : predictExercisePerformance({ ...options, weightUnit: unit });
        const step = unit === "LB" ? 5 : 2.5;
        const lastLoad = previous.weightLb === null ? null : convertStoredWeightToDisplay(roundStoredWeightToGymIncrement(previous.weightLb, unit), unit);
        for (const set of bounded.predictedSets) {
          assert.ok(Number.isInteger(set.reps) && set.reps > 0);
          if (set.weightLb === null) continue;
          const load = convertStoredWeightToDisplay(set.weightLb, unit);
          assert.ok(Number.isFinite(load) && load > 0);
          assert.ok(Math.abs(load / step - Math.round(load / step)) < 0.001, "Unloading increment");
          assert.ok(load <= Math.max(step, lastLoad + step) + 0.01, "Exceeded one-increment increase");
        }
      }
      const repeatWeight = previous.weightLb === null ? null : roundStoredWeightToGymIncrement(previous.weightLb, "LB");
      const predictedStrength = top.weightLb === null ? top.reps : computeSetStrength(top.weightLb, top.reps);
      const repeatStrength = repeatWeight === null ? previous.reps : computeSetStrength(repeatWeight, previous.reps);
      let group = cohorts.get(cohort);
      if (!group) { group = accumulator(); cohorts.set(cohort, group); }
      for (const metrics of [total, group, seriesMetrics]) {
        metrics.targets += 1;
        metrics.ridge += Number(prediction.model.source === "ridge");
        metrics.relativeError += Math.abs(predictedStrength - actual.strength) / actual.strength;
        metrics.repeatRelativeError += Math.abs(repeatStrength - actual.strength) / actual.strength;
        if (actual.weightLb === null) {
          metrics.bodyweight += 1;
          metrics.repError += Math.abs(top.reps - actual.reps);
          metrics.repeatRepError += Math.abs(previous.reps - actual.reps);
        } else {
          metrics.weighted += 1;
          metrics.weightError += Math.abs(top.weightLb - actual.weightLb);
          metrics.repeatWeightError += Math.abs(repeatWeight - actual.weightLb);
        }
      }
    }
    if (seriesMetrics.targets) {
      evaluatedSeries += 1;
      seriesErrors.push([seriesMetrics.relativeError / seriesMetrics.targets, seriesMetrics.repeatRelativeError / seriesMetrics.targets]);
    }
  }
  assert.ok(total.targets > 0, "No evaluable targets");
  if (!database) assert.ok(total.ridge > 0, "Synthetic scenarios never exercised learned inference");
  const aggregate = report(total);
  return {
    protocol: "v1: fixed lambda=1, four features, inner four-fold walk-forward gate, outer last-third walk-forward evaluation; no tuning on outer targets",
    dataSource: data.dataSource,
    users: data.users,
    availableSeries: data.series.length,
    evaluatedSeries,
    skippedModeChanges,
    aggregate,
    macroStrengthRelativeMae: seriesErrors.reduce((sum, row) => sum + row[0], 0) / seriesErrors.length,
    macroRepeatStrengthRelativeMae: seriesErrors.reduce((sum, row) => sum + row[1], 0) / seriesErrors.length,
    cohorts: Object.fromEntries(Array.from(cohorts, ([name, metrics]) => [name, report(metrics)])),
    runtime: { meanMs: latencyMs / total.targets, maxMs: maxLatencyMs },
    checks: { futureAndTargetLeakage: "passed", gymIncrementsAndBounds: "passed", nonInferiorityWithinTwoPercent: total.relativeError <= total.repeatRelativeError * 1.02 },
    limitations: "Predicts logged choices, not safe capacity or causal training benefit. Historical edits cannot be reconstructed. Synthetic cases are diagnostics, not a real-user benchmark. Confidence remains an uncalibrated history-quality label. No raw records are exported.",
  };
}

const result = evaluate(database ? await databaseSeries() : syntheticSeries());
const json = `${JSON.stringify(result, null, 2)}\n`;
if (output) await writeFile(output, json);
process.stdout.write(json);
if (!result.checks.nonInferiorityWithinTwoPercent) process.exitCode = 1;
