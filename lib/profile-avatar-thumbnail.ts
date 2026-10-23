import { unstable_cache } from "next/cache";
import sharp from "sharp";
import { prisma } from "./prisma";

export type HeaderAvatar = {
  url: string;
  dataUrl: string;
};

export function createProfileAvatarThumbnail(bytes: Uint8Array) {
  return sharp(bytes, { animated: true })
    .rotate()
    .resize(120, 120, { fit: "cover", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

/** Embed the small header image, not the original upload, in authenticated HTML. */
export async function loadHeaderAvatar(user: {
  id: string;
  profileImageUpdatedAt: Date | null;
}): Promise<HeaderAvatar | null> {
  if (!user.profileImageUpdatedAt) return null;
  const version = user.profileImageUpdatedAt.toISOString();
  try {
    const dataUrl = await unstable_cache(async () => {
      const profile = await prisma.user.findUnique({
        where: { id: user.id, profileImageUpdatedAt: new Date(version) },
        select: { profileImageBytes: true, profileImageMimeType: true },
      });
      if (!profile?.profileImageBytes || !profile.profileImageMimeType) return null;
      const thumbnail = await createProfileAvatarThumbnail(profile.profileImageBytes);
      return `data:image/webp;base64,${thumbnail.toString("base64")}`;
    }, ["header-avatar", "v1", user.id, version], { revalidate: 86400 })();
    return dataUrl ? {
      url: `/api/profile/avatar?v=${encodeURIComponent(version)}`,
      dataUrl,
    } : null;
  } catch (error) {
    // An unavailable photo must not prevent the authenticated app from opening.
    console.error("header avatar load failure:", error);
    return null;
  }
}
