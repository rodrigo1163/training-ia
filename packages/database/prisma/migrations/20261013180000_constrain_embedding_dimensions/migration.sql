ALTER TABLE "document_chunk_embedding"
ALTER COLUMN "embedding" TYPE public.vector(1536)
USING "embedding"::public.vector(1536);
