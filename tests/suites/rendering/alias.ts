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

const moduleAny = Module as unknown as { _resolveFilename: Resolver };
const original = moduleAny._resolveFilename;

moduleAny._resolveFilename = function patched(request, parent, isMain, options) {
  const mapped = request.startsWith("@/")
    ? resolve(distRoot, request.slice(2))
    : request;

  return original.call(this, mapped, parent, isMain, options);
};

export {};
