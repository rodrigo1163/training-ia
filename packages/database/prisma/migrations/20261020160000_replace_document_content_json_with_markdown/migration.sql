ALTER TABLE "document_content"
RENAME COLUMN "text" TO "markdown";

ALTER TABLE "document_content"
DROP COLUMN "content";
