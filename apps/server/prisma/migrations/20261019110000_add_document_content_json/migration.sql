ALTER TABLE "document_content"
ADD COLUMN "content" JSONB;

UPDATE "document_content"
SET "content" = jsonb_build_object(
  'type', 'doc',
  'content', jsonb_build_array(
    jsonb_build_object(
      'type', 'paragraph',
      'content', CASE
        WHEN "text" = '' THEN '[]'::jsonb
        ELSE jsonb_build_array(jsonb_build_object('type', 'text', 'text', "text"))
      END
    )
  )
)
WHERE "content" IS NULL;

ALTER TABLE "document_content"
ALTER COLUMN "content" SET NOT NULL;
