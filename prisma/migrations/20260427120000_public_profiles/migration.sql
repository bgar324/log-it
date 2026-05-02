ALTER TABLE "public"."User"
ADD COLUMN "publicProfileEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "profileImageBytes" BYTEA,
ADD COLUMN "profileImageMimeType" TEXT,
ADD COLUMN "profileImageUpdatedAt" TIMESTAMP(3);
