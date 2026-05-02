import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

type RouteContext = {
  params: Promise<{ username: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { username } = await context.params;
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      publicProfileEnabled: true,
      profileImageBytes: true,
      profileImageMimeType: true,
      profileImageUpdatedAt: true,
    },
  });

  if (
    !user?.publicProfileEnabled ||
    !user.profileImageBytes ||
    !user.profileImageMimeType
  ) {
    return new NextResponse(null, { status: 404 });
  }

  const imageBuffer = new ArrayBuffer(user.profileImageBytes.byteLength);
  new Uint8Array(imageBuffer).set(user.profileImageBytes);
  const imageBody = new Blob([imageBuffer], {
    type: user.profileImageMimeType,
  });

  return new NextResponse(imageBody, {
    status: 200,
    headers: {
      "Content-Type": user.profileImageMimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Last-Modified": user.profileImageUpdatedAt?.toUTCString() ?? new Date().toUTCString(),
    },
  });
}
