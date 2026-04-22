const INVALID_REQUEST_ORIGIN_ERROR = "Invalid request origin.";

function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return null;
  }
}

function normalizeForwardedHost(value: string | null) {
  const host = value?.split(",")[0]?.trim().toLowerCase();
  return host || null;
}

function normalizeForwardedProto(value: string | null) {
  const protocol = value?.split(",")[0]?.trim().toLowerCase();
  return protocol || null;
}

function getAllowedOriginsFromEnv() {
  const raw = process.env.ALLOWED_WEB_ORIGINS ?? "";

  return raw
    .split(",")
    .map((entry) => normalizeOrigin(entry.trim()))
    .filter((entry): entry is string => entry !== null);
}

function getRequestOrigin(request: Request) {
  const url = new URL(request.url);
  const host = normalizeForwardedHost(
    request.headers.get("x-forwarded-host") ?? request.headers.get("host"),
  );
  const protocol =
    normalizeForwardedProto(request.headers.get("x-forwarded-proto")) ??
    url.protocol.replace(/:$/, "").toLowerCase();

  if (!host) {
    return url.origin.toLowerCase();
  }

  return normalizeOrigin(`${protocol}://${host}`) ?? url.origin.toLowerCase();
}

function getSourceOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (origin) {
    return normalizeOrigin(origin);
  }

  const referer = request.headers.get("referer");
  return referer ? normalizeOrigin(referer) : null;
}

export function isTrustedMutationRequest(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase();

  if (fetchSite === "cross-site") {
    return false;
  }

  const sourceOrigin = getSourceOrigin(request);

  if (!sourceOrigin) {
    return false;
  }

  const allowedOrigins = new Set<string>([
    getRequestOrigin(request),
    ...getAllowedOriginsFromEnv(),
  ]);

  return allowedOrigins.has(sourceOrigin);
}

export function getInvalidRequestOriginError() {
  return INVALID_REQUEST_ORIGIN_ERROR;
}
