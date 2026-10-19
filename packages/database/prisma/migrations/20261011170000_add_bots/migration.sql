CREATE TABLE "bot" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bot_organizationId_slug_key" ON "bot"("organizationId", "slug");
CREATE INDEX "bot_organizationId_idx" ON "bot"("organizationId");

ALTER TABLE "bot" ADD CONSTRAINT "bot_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "bot" ("id", "organizationId", "name", "slug", "createdAt", "updatedAt")
SELECT 'default-bot:' || "id", "id", 'Default Bot', 'default', "createdAt", "createdAt"
FROM "organization";

ALTER TABLE "document" ADD COLUMN "botId" TEXT;

UPDATE "document" AS document
SET "botId" = bot."id"
FROM "bot" AS bot
WHERE bot."organizationId" = document."organizationId"
  AND bot."slug" = 'default';

ALTER TABLE "document" ALTER COLUMN "botId" SET NOT NULL;
CREATE INDEX "document_botId_idx" ON "document"("botId");

ALTER TABLE "document" ADD CONSTRAINT "document_botId_fkey"
FOREIGN KEY ("botId") REFERENCES "bot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document" DROP CONSTRAINT "document_organizationId_fkey";
DROP INDEX "document_organizationId_idx";
ALTER TABLE "document" DROP COLUMN "organizationId";
