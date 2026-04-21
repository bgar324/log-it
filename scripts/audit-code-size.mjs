import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_DIRS = ["app", "lib", "scripts", "tests", "prisma"];
const CODE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".prisma",
]);
const IGNORED_DIRS = new Set(["node_modules", ".next", ".git", "coverage"]);

function readNumericFlag(flag, fallback) {
  const index = process.argv.indexOf(flag);

  if (index === -1) {
    return fallback;
  }

  const rawValue = process.argv[index + 1];
  const parsedValue = Number.parseInt(rawValue ?? "", 10);

  return Number.isInteger(parsedValue) ? parsedValue : fallback;
}

function formatLabel(value, singular, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function countPatternMatches(source, pattern) {
  return Array.from(source.matchAll(pattern)).length;
}

function countFunctions(source) {
  return (
    countPatternMatches(
      source,
      /^\s*(export\s+)?(async\s+)?function\s+[A-Za-z0-9_$]+\s*\(/gm,
    ) +
    countPatternMatches(
      source,
      /^\s*(export\s+)?const\s+[A-Za-z0-9_$]+\s*=\s*(async\s*)?\([^)]*\)\s*=>/gm,
    ) +
    countPatternMatches(
      source,
      /^\s*(export\s+)?const\s+[A-Za-z0-9_$]+\s*=\s*(async\s*)?[A-Za-z0-9_$]+\s*=>/gm,
    )
  );
}

async function walk(relativeDir) {
  const absoluteDir = path.join(process.cwd(), relativeDir);
  const entries = await readdir(absoluteDir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) {
      continue;
    }

    const relativePath = path.join(relativeDir, entry.name);

    if (entry.isDirectory()) {
      results.push(...(await walk(relativePath)));
      continue;
    }

    if (!CODE_EXTENSIONS.has(path.extname(entry.name))) {
      continue;
    }

    results.push(relativePath);
  }

  return results;
}

function printRows(title, rows) {
  console.log(`\n${title}`);

  if (rows.length === 0) {
    console.log("  none");
    return;
  }

  for (const row of rows) {
    console.log(
      `  ${String(row.lines).padStart(4, " ")} lines  ${String(
        row.functions,
      ).padStart(3, " ")} functions  ${row.path}`,
    );
  }
}

async function main() {
  const maxLines = readNumericFlag("--max-lines", 350);
  const maxFunctions = readNumericFlag("--max-functions", 12);
  const top = readNumericFlag("--top", 15);
  const strict = process.argv.includes("--strict");

  const files = (
    await Promise.all(
      SOURCE_DIRS.map(async (dir) => {
        try {
          return await walk(dir);
        } catch {
          return [];
        }
      }),
    )
  ).flat();

  const auditRows = await Promise.all(
    files.map(async (relativePath) => {
      const source = await readFile(relativePath, "utf8");
      return {
        path: relativePath,
        lines: source.split(/\r?\n/).length,
        functions: countFunctions(source),
      };
    }),
  );

  const byLines = [...auditRows].sort((left, right) => right.lines - left.lines);
  const byFunctions = [...auditRows].sort(
    (left, right) => right.functions - left.functions,
  );
  const oversized = byLines.filter((row) => row.lines > maxLines);
  const overFunctionBudget = byFunctions.filter(
    (row) => row.functions > maxFunctions,
  );

  console.log("Code Size Audit");
  console.log(
    `Thresholds: ${formatLabel(maxLines, "line")}, ${formatLabel(
      maxFunctions,
      "function",
    )}`,
  );
  console.log(`Scanned: ${formatLabel(auditRows.length, "file")}`);

  printRows(`Over ${maxLines} lines`, oversized.slice(0, top));
  printRows(`Over ${maxFunctions} functions`, overFunctionBudget.slice(0, top));
  printRows("Top files by line count", byLines.slice(0, top));

  if (strict && (oversized.length > 0 || overFunctionBudget.length > 0)) {
    process.exitCode = 1;
  }
}

await main();
