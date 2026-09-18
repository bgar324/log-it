export function isWorkspaceEnabled(user: { id: string }) {
  const ids = process.env.WORKSPACE_ENABLED_USER_IDS;
  return Boolean(user.id && ids?.split(",").some(id => id.trim() === user.id));
}
