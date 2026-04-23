import { createHash } from "node:crypto";

const DEVELOPMENT_AUTH_SECRET_NAMESPACE = "logit-dev-auth";

export function deriveDevelopmentSessionSecret(cwd = process.cwd()) {
  return createHash("sha256")
    .update(DEVELOPMENT_AUTH_SECRET_NAMESPACE)
    .update("\0")
    .update(cwd)
    .digest();
}
