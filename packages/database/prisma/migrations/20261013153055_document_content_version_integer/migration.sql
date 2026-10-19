-- AlterTable
ALTER TABLE "document_content"
ALTER COLUMN "version" TYPE INTEGER
USING "version"::INTEGER;
