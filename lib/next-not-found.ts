/**
 * Page loaders signal "no such record" by calling `notFound()`, which throws a
 * routing error rather than returning. A JSON handler reusing such a loader has
 * to turn that throw into a 404 body the client can read, while anything else
 * stays a real failure. Next marks the throw with a `digest` string; narrowing
 * to it without a cast keeps an unrelated failure from being read as a 404.
 */
export function isNextNotFoundError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return false;
  }

  const { digest } = error;

  return (
    typeof digest === "string" &&
    (digest === "NEXT_NOT_FOUND" || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK;404"))
  );
}
