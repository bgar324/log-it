import { readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const suiteName = process.argv[2] ?? null;
const repoRoot = process.cwd();
const distRoot = resolve(repoRoot, ".tests-dist");
const testRoot = suiteName
  ? resolve(distRoot, "tests", "suites", suiteName)
  : resolve(distRoot, "tests");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function collectTestFiles(directory) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectTestFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".test.js")) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

rmSync(distRoot, { recursive: true, force: true });
run(process.execPath, [resolve(repoRoot, "node_modules/typescript/bin/tsc"), "-p", "tsconfig.test.json"]);

let testFiles;

try {
  testFiles = collectTestFiles(testRoot);
} catch {
  console.error(
    suiteName
      ? `No compiled tests were found for suite "${suiteName}".`
      : "No compiled tests were found.",
  );
  process.exit(1);
}

if (testFiles.length === 0) {
  console.error(
    suiteName ? `Suite "${suiteName}" has no test files.` : "No test files were found.",
  );
  process.exit(1);
}

run(process.execPath, ["--test", ...testFiles]);
