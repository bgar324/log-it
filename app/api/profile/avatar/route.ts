import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { validateProfileImageFile } from "../../../../lib/profile-avatar";
import {
  getInvalidRequestOriginError,
  isTrustedMutationRequest,
} from "../../../../lib/request-security";

type UploadFile = {
  size: number;
  type: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

function isUploadFile(value: unknown): value is UploadFile {
  return (
    typeof value === "object" &&
    value !== null &&
    "size" in value &&
    "type" in value &&
    "arrayBuffer" in value &&
    typeof (value as { arrayBuffer: unknown }).arrayBuffer === "function" &&
    typeof (value as { size: unknown }).size === "number" &&
    typeof (value as { type: unknown }).type === "string"
  );
}

function toAvatarErrorResponse(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  ) {
    return NextResponse.json(
      { ok: false, error: "Service temporarily unavailable." },
      { status: 503 },
    );
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json(
      { ok: false, error: "Service temporarily unavailable." },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { ok: false, error: "Unable to update profile picture." },
    { status: 500 },
  );
}

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return new NextResponse(null, { status: 401 });
  }

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      profileImageBytes: true,
      profileImageMimeType: true,
      profileImageUpdatedAt: true,
    },
  });

  if (!profile?.profileImageBytes || !profile.profileImageMimeType) {
    return new NextResponse(null, { status: 404 });
  }

  const imageBuffer = new ArrayBuffer(profile.profileImageBytes.byteLength);
  new Uint8Array(imageBuffer).set(profile.profileImageBytes);
  const imageBody = new Blob([imageBuffer], {
    type: profile.profileImageMimeType,
  });

  return new NextResponse(imageBody, {
    status: 200,
    headers: {
      "Content-Type": profile.profileImageMimeType,
      "Cache-Control": "private, max-age=31536000, immutable",
      "Last-Modified": profile.profileImageUpdatedAt?.toUTCString() ?? new Date().toUTCString(),
    },
  });
}

export async function POST(request: NextRequest) {
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json(
      { ok: false, error: getInvalidRequestOriginError() },
      { status: 403 },
    );
  }

  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!isUploadFile(image)) {
      return NextResponse.json(
        { ok: false, error: "Choose an image to upload." },
        { status: 400 },
      );
    }

    const validationError = validateProfileImageFile(image);

    if (validationError) {
      return NextResponse.json(
        { ok: false, error: validationError },
        { status: 400 },
      );
    }

    const updatedAt = new Date();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        profileImageBytes: Buffer.from(await image.arrayBuffer()),
        profileImageMimeType: image.type,
        profileImageUpdatedAt: updatedAt,
      },
      select: { id: true },
    });

    return NextResponse.json({
      ok: true,
      profileImageUpdatedAt: updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("profile avatar upload failure:", error);
    return toAvatarErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json(
      { ok: false, error: getInvalidRequestOriginError() },
      { status: 403 },
    );
  }

  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        profileImageBytes: null,
        profileImageMimeType: null,
        profileImageUpdatedAt: null,
      },
      select: { id: true },
    });

    return NextResponse.json({
      ok: true,
      profileImageUpdatedAt: null,
    });
  } catch (error) {
    console.error("profile avatar delete failure:", error);
    return toAvatarErrorResponse(error);
  }
}
