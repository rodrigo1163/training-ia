-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "DocumentStatus" ADD VALUE 'READY';
ALTER TYPE "DocumentStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "document" ADD COLUMN     "textHash" TEXT;

-- CreateTable
CREATE TABLE "document_content" (
    "documentId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL,
    "version" TEXT NOT NULL,

    CONSTRAINT "document_content_pkey" PRIMARY KEY ("documentId")
);

-- AddForeignKey
ALTER TABLE "document_content" ADD CONSTRAINT "document_content_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
