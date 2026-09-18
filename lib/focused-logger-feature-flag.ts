export function isFocusedLoggerEnabled(user: { id: string }) {
  const ids = process.env.FOCUSED_LOGGER_USER_IDS;
  return Boolean(user.id && ids?.split(",").some(id => id.trim() === user.id));
}
