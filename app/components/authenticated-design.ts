import { getSessionUser } from "@/lib/auth";
import { isBenFeatureEnabled } from "@/lib/posthog-feature-flags";
import { isWorkspaceEnabled } from "@/lib/workspace-feature-flag";
export async function loadAuthenticatedDesign() {
  // React cache shares these reads with the protected page in this request,
  // never across users or requests. Loading UI receives the same capabilities.
  const user = await getSessionUser();
  // Ben is the owner-only gate on the redesigned authenticated app, so it is
  // resolved for every signed-in session — not just workspace ones. Without a
  // session there is nothing to evaluate the flag against, and the shipped
  // design is what an unflagged reader gets.
  if (!user) return { enabled: false, benEnabled: false };
  return { enabled: isWorkspaceEnabled(user), benEnabled: await isBenFeatureEnabled(user) };
}
