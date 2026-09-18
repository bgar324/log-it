import { getSessionUser } from "@/lib/auth";
import { isBenFeatureEnabled } from "@/lib/posthog-feature-flags";
import { isWorkspaceEnabled } from "@/lib/workspace-feature-flag";
export async function loadAuthenticatedDesign() {
  // React cache shares these reads with the protected page in this request,
  // never across users or requests. Loading UI receives the same capabilities.
  const user = await getSessionUser();
  const enabled = Boolean(user && isWorkspaceEnabled(user));
  const benEnabled = enabled && user ? await isBenFeatureEnabled(user) : true;
  return { enabled, benEnabled };
}
