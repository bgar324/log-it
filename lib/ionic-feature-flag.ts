export type IonicFeatureFlagUser = { id: string };

/** Server-only rollout, keyed by immutable account IDs, never editable profile fields. */
export async function isIonicEnabled(user: IonicFeatureFlagUser): Promise<boolean> {
  const allowlist = process.env.IONIC_ENABLED_USER_IDS;
  return Boolean(user.id && allowlist?.split(",").some(entry => entry.trim() === user.id));
}
