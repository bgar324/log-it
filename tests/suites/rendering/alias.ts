// tsc rewrites types for the "@/*" path alias but leaves the emitted require()
// calls untouched, so components that import "@/lib/..." fail to resolve once
// compiled. Teach CommonJS the same mapping, rooted at the compiled output.
import Module from "node:module";
import { resolve } from "node:path";

const distRoot = resolve(__dirname, "..", "..", "..");

type Resolver = (
  request: string,
  parent: NodeJS.Module | undefined,
  isMain: boolean,
  options?: unknown,
) => string;

type Loader = (request: string, parent: NodeJS.Module | undefined, isMain: boolean) => unknown;
const moduleAny = Module as unknown as { _resolveFilename: Resolver; _load: Loader };
const original = moduleAny._resolveFilename;

moduleAny._resolveFilename = function patched(request, parent, isMain, options) {
  const mapped = request.startsWith("@/")
    ? resolve(distRoot, request.slice(2))
    : request;

  return original.call(this, mapped, parent, isMain, options);
};

// Node does not load CSS; computed styles and layout are verified in Chromium.
const originalLoad = moduleAny._load;
moduleAny._load = function load(request, parent, isMain) {
  if (request.endsWith(".module.css")) {
    return { __esModule: true, default: new Proxy({}, { get: (_target, key) => String(key) }) };
  }
  return originalLoad.call(this, request, parent, isMain);
};

export {};
