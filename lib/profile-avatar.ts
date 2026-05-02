export const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024;

export const PROFILE_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export type ProfileImageLike = {
  size: number;
  type: string;
};

export function validateProfileImageFile(file: ProfileImageLike | null) {
  if (!file) {
    return "Choose an image to upload.";
  }

  if (!PROFILE_IMAGE_MIME_TYPES.has(file.type)) {
    return "Profile pictures must be JPEG, PNG, WebP, or GIF images.";
  }

  if (file.size <= 0) {
    return "Choose an image to upload.";
  }

  if (file.size > MAX_PROFILE_IMAGE_BYTES) {
    return "Profile pictures must be 2 MB or smaller.";
  }

  return null;
}
