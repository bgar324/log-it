// One definition of what a username is. Registration and profile edits both
// enforce it, so the rule cannot drift between the two paths.
export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,24}$/;

export const USERNAME_RULE_MESSAGE =
  "Usernames use 3 to 24 letters, numbers, or underscores.";

export function isValidUsername(value: string) {
  return USERNAME_REGEX.test(value);
}
