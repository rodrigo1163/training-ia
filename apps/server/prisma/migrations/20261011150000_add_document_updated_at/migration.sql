-- AlterTable
ALTER TABLE "document" ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "document"
SET "updatedAt" = "createdAt";

ALTER TABLE "document" ALTER COLUMN "updatedAt" SET NOT NULL;
