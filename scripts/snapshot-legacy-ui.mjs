// Snapshots the baseline authenticated UI into app/_legacy so the redesign can
// ship behind the server-evaluated Ben flag while unflagged users and the public
// previews keep rendering exactly what the baseline commit rendered.
//
// The snapshot is the *affected closure*, not a fork of the app: only modules the
// redesign actually changed (plus the roots the flag gate renders, plus every
// module in the reachable graph that imports one of those) are copied. Everything
// else — lib/, API handlers, server data loaders, dashboard data*/types, the
// workspace and Ionic implementations, and the shared workspace design context —
// stays single-source and is reached through its original absolute path.
//
// Usage: node scripts/snapshot-legacy-ui.mjs [baseline-ref]

import { execFileSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const BASELINE_REF = process.argv[2] ?? "1d7c93d";
const OUTPUT_ROOT = "app/_legacy";

// The modules the flag gate renders directly. Forced into the snapshot even when
// the redesign left them untouched, so the gate always has a stable baseline entry.
const ROOTS = [
  "app/dashboard/dashboard-client.tsx",
  "app/workouts/new/workout-logger.tsx",
  "app/workouts/[workoutId]/page.tsx",
  "app/workouts/[workoutId]/loading.tsx",
  "app/workouts/new/loading.tsx",
  "app/exercises/[exerciseKey]/page.tsx",
  "app/exercises/[exerciseKey]/loading.tsx",
  "app/preview/[view]/product-preview.tsx",
  "app/components/ui/toaster.tsx",
];

// Never cloned: duplicating any of these would fork server behaviour, fork a React
// context, or fork a design system that the redesign owns outright.
const SHARED_ONLY = [
  (file) => !file.startsWith("app/"),
  (file) => file.startsWith(`${OUTPUT_ROOT}/`),
  (file) => file.startsWith("app/api/"),
  (file) => file.startsWith("app/workspace/"),
  (file) => file.startsWith("app/ionic/"),
  (file) => file.startsWith("app/components/workspace-"),
  (file) => file.startsWith("app/dashboard/data."),
  (file) => file === "app/dashboard/dashboard-types.ts",
  (file) => file === "app/globals.css",
  (file) => file.endsWith(".data.ts"),
];

const COPYABLE_EXTENSIONS = [".ts", ".tsx", ".css"];

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
}

const baselineSha = git("rev-parse", BASELINE_REF).trim();
const baselineFiles = new Set(git("ls-tree", "-r", "--name-only", baselineSha).split("\n").filter(Boolean));

const sources = new Map();
function baselineSource(file) {
  let source = sources.get(file);
  if (source === undefined) {
    source = git("show", `${baselineSha}:${file}`);
    sources.set(file, source);
  }
  return source;
}

// Everything the working tree changed, deleted, or renamed away from the baseline.
// Added files never existed at the baseline, so they can never seed the snapshot.
const changedSinceBaseline = new Set(
  git("diff", "--name-status", baselineSha, "--", "app")
    .split("\n")
    .filter(Boolean)
    .flatMap((line) => line.split("\t").slice(1))
    .filter((file) => baselineFiles.has(file)),
);

function isCopyable(file) {
  if (!COPYABLE_EXTENSIONS.some((extension) => file.endsWith(extension))) return false;
  return !SHARED_ONLY.some((excluded) => excluded(file));
}

function resolveSpecifier(specifier, fromFile) {
  let base;
  if (specifier.startsWith("@/")) base = specifier.slice(2);
  else if (specifier.startsWith(".")) base = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), specifier));
  else return null;
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.d.ts`, `${base}/index.ts`, `${base}/index.tsx`];
  const resolved = candidates.find((candidate) => baselineFiles.has(candidate));
  if (resolved) return resolved;
  // `@/lib/generated/*` and friends are absolute already and untracked; leaving them
  // alone is correct. A relative miss is always a bug in this resolver.
  if (specifier.startsWith(".")) throw new Error(`Cannot resolve "${specifier}" from ${fromFile} at ${baselineSha}`);
  return null;
}

function moduleSpecifierNodes(sourceFile) {
  const nodes = [];
  const visit = (node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      nodes.push(node.moduleSpecifier);
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const [first] = node.arguments;
      if (first && ts.isStringLiteral(first)) nodes.push(first);
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) {
      nodes.push(node.argument.literal);
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sourceFile, visit);
  return nodes;
}

function parse(file) {
  return ts.createSourceFile(
    file,
    baselineSource(file),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

// Phase 1 — reachable graph. Walk the baseline imports of the roots, descending only
// through modules the snapshot is allowed to own. A shared module is recorded as a
// dependency but never expanded: its own imports stay bound to the live app.
const dependencies = new Map();
const queue = [];
for (const root of ROOTS) {
  if (!baselineFiles.has(root)) throw new Error(`Root ${root} does not exist at ${baselineSha}`);
  if (!isCopyable(root)) throw new Error(`Root ${root} is excluded from cloning`);
  queue.push(root);
}
while (queue.length) {
  const file = queue.shift();
  if (dependencies.has(file)) continue;
  if (!file.endsWith(".ts") && !file.endsWith(".tsx")) {
    dependencies.set(file, []);
    continue;
  }
  const sourceFile = parse(file);
  const resolved = [];
  for (const node of moduleSpecifierNodes(sourceFile)) {
    const target = resolveSpecifier(node.text, file);
    if (!target) continue;
    resolved.push(target);
    if (isCopyable(target)) queue.push(target);
  }
  dependencies.set(file, resolved);
}

// Phase 2 — copy set. Seed with the roots plus every reachable module the redesign
// changed or deleted, then close backwards: a module that imports a snapshotted
// module must be snapshotted too, or it would render baseline markup with redesigned
// styles.
const reasons = new Map(ROOTS.map((root) => [root, "root"]));
for (const file of dependencies.keys()) {
  if (changedSinceBaseline.has(file) && isCopyable(file) && !reasons.has(file)) reasons.set(file, "changed by the redesign");
}
for (let growing = true; growing; ) {
  growing = false;
  for (const [file, targets] of dependencies) {
    if (reasons.has(file) || !isCopyable(file)) continue;
    const trigger = targets.find((target) => reasons.has(target));
    if (trigger) {
      reasons.set(file, `imports ${trigger}`);
      growing = true;
    }
  }
}
const copied = new Set(reasons.keys());

function legacyPath(file) {
  return `${OUTPUT_ROOT}/${file.slice("app/".length)}`;
}

function rewrittenSpecifier(file) {
  const base = copied.has(file) ? legacyPath(file) : file;
  return `@/${base.replace(/\.(tsx?|jsx?|mjs)$/, "")}`;
}

// The redesign made `asOfDate`/`activityDays`/`dailySeries` required on
// DashboardClientData, and that type stays shared. The baseline preview fixture is
// the only literal that has to satisfy it, so derive the new fields from the dates
// and totals already in the fixture. No baseline view reads them, so the rendered
// preview is unchanged.
const FIXTURE_PRELUDE = `// Additive fields required by the shared DashboardClientData contract. Derived
// from this fixture's own dates and totals; no baseline view below reads them.
const PREVIEW_AS_OF_DATE = "2026-08-12";
const PREVIEW_LOGGED_ENTRIES = PREVIEW_WORKOUTS.flatMap((month) => month.entries);
const PREVIEW_ACTIVITY_DAYS = PREVIEW_LOGGED_ENTRIES.map((entry) => ({
  date: entry.performedAtDate,
  count: 1,
}));
const PREVIEW_DAILY_SERIES = PREVIEW_LOGGED_ENTRIES.map((entry) => ({
  date: entry.performedAtDate,
  sessions: 1,
  sets: entry.setCount,
  volume: entry.volume,
}));

`;

const FIXTURE_FIELDS = {
  overview: ["asOfDate: PREVIEW_AS_OF_DATE", "activityDays: PREVIEW_ACTIVITY_DAYS"],
  progress: ["asOfDate: PREVIEW_AS_OF_DATE", "dailySeries: PREVIEW_DAILY_SERIES"],
};

function previewFixtureEdits(sourceFile) {
  const edits = [];
  const statement = sourceFile.statements.find(
    (node) =>
      ts.isVariableStatement(node) &&
      node.declarationList.declarations.some((declaration) => declaration.name.getText(sourceFile) === "PREVIEW_DATA"),
  );
  if (!statement) throw new Error("PREVIEW_DATA fixture not found in the baseline preview");
  edits.push({ start: statement.getStart(sourceFile), end: statement.getStart(sourceFile), text: FIXTURE_PRELUDE });

  const declaration = statement.declarationList.declarations.find((node) => node.name.getText(sourceFile) === "PREVIEW_DATA");
  let literal = declaration.initializer;
  while (literal && ts.isSatisfiesExpression(literal)) literal = literal.expression;
  if (!literal || !ts.isObjectLiteralExpression(literal)) throw new Error("PREVIEW_DATA is not an object literal");

  for (const [name, fields] of Object.entries(FIXTURE_FIELDS)) {
    const property = literal.properties.find(
      (node) => ts.isPropertyAssignment(node) && node.name.getText(sourceFile) === name && ts.isObjectLiteralExpression(node.initializer),
    );
    if (!property) throw new Error(`PREVIEW_DATA.${name} is not an object literal`);
    const existing = new Set(property.initializer.properties.map((node) => node.name?.getText(sourceFile)));
    const missing = fields.filter((field) => !existing.has(field.slice(0, field.indexOf(":"))));
    if (!missing.length) continue;
    const insertAt = property.initializer.getStart(sourceFile) + 1;
    edits.push({ start: insertAt, end: insertAt, text: `\n${missing.map((field) => `    ${field},`).join("\n")}` });
  }
  return edits;
}

function snapshot(file) {
  if (file.endsWith(".css")) return baselineSource(file);
  const sourceFile = parse(file);
  const edits = moduleSpecifierNodes(sourceFile)
    .map((node) => ({ node, target: resolveSpecifier(node.text, file) }))
    .filter(({ target }) => target !== null)
    .map(({ node, target }) => ({
      start: node.getStart(sourceFile),
      end: node.getEnd(),
      text: JSON.stringify(rewrittenSpecifier(target)),
    }));
  if (file === "app/preview/[view]/product-preview.tsx") edits.push(...previewFixtureEdits(sourceFile));

  let text = sourceFile.text;
  for (const edit of edits.sort((a, b) => b.start - a.start || b.end - a.end)) {
    text = text.slice(0, edit.start) + edit.text + text.slice(edit.end);
  }
  return text;
}

await rm(OUTPUT_ROOT, { recursive: true, force: true });
const written = [...copied].sort();
for (const file of written) {
  const destination = legacyPath(file);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, snapshot(file));
}

// Report — the snapshot is only trustworthy if the shared edges are visible.
const sharedEdges = new Map();
for (const file of written) {
  for (const target of dependencies.get(file) ?? []) {
    if (copied.has(target)) continue;
    if (!sharedEdges.has(target)) sharedEdges.set(target, []);
    sharedEdges.get(target).push(file);
  }
}
const drifted = [...sharedEdges.keys()].filter((file) => changedSinceBaseline.has(file)).sort();

console.log(`baseline ${BASELINE_REF} -> ${baselineSha}`);
console.log(`reachable baseline modules: ${dependencies.size}`);
console.log(`snapshotted into ${OUTPUT_ROOT}: ${written.length} files`);
console.log("\nroots:");
for (const root of ROOTS) console.log(`  ${root} -> ${legacyPath(root)}`);
console.log("\nsnapshotted files (why each one is in the closure):");
for (const file of written) console.log(`  ${legacyPath(file)}  <- ${reasons.get(file)}`);
console.log(`\nshared modules still imported from their originals: ${sharedEdges.size}`);
for (const target of [...sharedEdges.keys()].sort()) console.log(`  @/${target} <- ${sharedEdges.get(target).length}`);
console.log(`\ncompatibility gaps — shared modules the redesign changed: ${drifted.length}`);
for (const target of drifted) {
  console.log(`  @/${target}`);
  for (const file of sharedEdges.get(target).sort()) console.log(`      imported by ${legacyPath(file)}`);
}
console.log(
  `\n${OUTPUT_ROOT} is an underscore-prefixed Next private folder, so nothing under it is routable;` +
    " the flag gate must import these modules explicitly.",
);
