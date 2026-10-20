import { unstable_cache } from "next/cache";
import { cache } from "react";

type FeatureFlagUser = {
  id: string;
  email: string;
  username: string;
};

const BEN_FLAG_KEY = "Ben";
const FEATURE_FLAG_TIMEOUT_MS = 2_000;

async function evaluateBenFeature(
  host: string,
  projectToken: string,
  id: string,
  email: string,
  username: string,
) {
  const response = await fetch(`${host.replace(/\/$/, "")}/flags/?v=2`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      token: projectToken,
      distinct_id: id,
      groups: {},
      person_properties: {
        email,
        username,
      },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(FEATURE_FLAG_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error("PostHog feature flag evaluation failed");
  }

  const data: unknown = await response.json();
  if (
    typeof data !== "object" ||
    data === null ||
    !("flags" in data) ||
    typeof data.flags !== "object" ||
    data.flags === null ||
    Array.isArray(data.flags)
  ) {
    throw new Error("Malformed PostHog feature flag response");
  }

  const flag: unknown = BEN_FLAG_KEY in data.flags ? data.flags[BEN_FLAG_KEY] : undefined;
  if (flag === undefined) {
    return false;
  }
  if (typeof flag === "boolean") {
    return flag;
  }
  if (
    typeof flag === "object" &&
    flag !== null &&
    "enabled" in flag &&
    typeof flag.enabled === "boolean"
  ) {
    return flag.enabled;
  }
  throw new Error("Malformed PostHog Ben feature flag");
}

const getCachedBenFeature = unstable_cache(
  evaluateBenFeature,
  ["logit-ben-capability-v1"],
  { revalidate: 60 },
);

export const isBenFeatureEnabled = cache(async (user: FeatureFlagUser) => {
  const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!projectToken || !host) {
    return false;
  }

  try {
    return await getCachedBenFeature(
      host,
      projectToken,
      user.id,
      user.email,
      user.username,
    );
  } catch {
    return false;
  }
});
