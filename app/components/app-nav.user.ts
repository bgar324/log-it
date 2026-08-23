import type { AppNavUser } from "./app-nav";

/**
 * Maps a session user onto the chrome's nav user. Server components use this so
 * detail routes can render the drawer without duplicating avatar-URL logic.
 */
export function appNavUserFromSession(user: {
  username: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUpdatedAt: Date | null;
}): AppNavUser {
  const firstName = (user.firstName ?? "").trim();
  const lastName = (user.lastName ?? "").trim();
  const fullName = `${firstName} ${lastName}`.trim();

  return {
    displayName: fullName || firstName || user.username,
    username: user.username,
    avatarUrl: user.profileImageUpdatedAt
      ? `/api/profile/avatar?v=${encodeURIComponent(user.profileImageUpdatedAt.toISOString())}`
      : null,
  };
}
