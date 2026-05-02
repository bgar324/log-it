import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_PROFILE_IMAGE_BYTES,
  validateProfileImageFile,
} from "../lib/profile-avatar";

test("validateProfileImageFile accepts supported image files", () => {
  assert.equal(
    validateProfileImageFile({
      type: "image/png",
      size: 24_000,
    }),
    null,
  );
});

test("validateProfileImageFile rejects missing, invalid, and oversized files", () => {
  assert.equal(validateProfileImageFile(null), "Choose an image to upload.");
  assert.equal(
    validateProfileImageFile({
      type: "application/pdf",
      size: 24_000,
    }),
    "Profile pictures must be JPEG, PNG, WebP, or GIF images.",
  );
  assert.equal(
    validateProfileImageFile({
      type: "image/jpeg",
      size: MAX_PROFILE_IMAGE_BYTES + 1,
    }),
    "Profile pictures must be 2 MB or smaller.",
  );
});
