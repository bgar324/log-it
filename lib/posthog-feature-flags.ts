type FeatureFlagUser = {
  id: string;
  email: string;
  username: string;
};

type FeatureFlagResponse = {
  flags?: Record<string, boolean | { enabled?: boolean }>;
};

const BEN_FLAG_KEY = "Ben";
const FEATURE_FLAG_TIMEOUT_MS = 2_000;

export async function isBenFeatureEnabled(user: FeatureFlagUser) {
  const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!projectToken || !host) {
    return false;
  }

  try {
    const response = await fetch(`${host.replace(/\/$/, "")}/flags/?v=2`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token: projectToken,
        distinct_id: user.id,
        groups: {},
        person_properties: {
          email: user.email,
          username: user.username,
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(FEATURE_FLAG_TIMEOUT_MS),
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as FeatureFlagResponse;
    const flag = data.flags?.[BEN_FLAG_KEY];

    return flag === true || (typeof flag === "object" && flag?.enabled === true);
  } catch {
    return false;
  }
}
