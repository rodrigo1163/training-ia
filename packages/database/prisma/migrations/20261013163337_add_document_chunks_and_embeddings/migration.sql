CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- CreateTable
CREATE TABLE "document_chunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "contentVersion" INTEGER NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "tokenCount" INTEGER,
    "pageStart" INTEGER,
    "pageEnd" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_chunk_embedding" (
    "id" TEXT NOT NULL,
    "chunkId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "dimensions" INTEGER NOT NULL,
    "embedding" public.vector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunk_embedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_chunk_documentId_contentVersion_idx" ON "document_chunk"("documentId", "contentVersion");

-- CreateIndex
CREATE UNIQUE INDEX "document_chunk_documentId_contentVersion_chunkIndex_key" ON "document_chunk"("documentId", "contentVersion", "chunkIndex");

-- CreateIndex
CREATE INDEX "document_chunk_embedding_model_idx" ON "document_chunk_embedding"("model");

-- CreateIndex
CREATE UNIQUE INDEX "document_chunk_embedding_chunkId_model_key" ON "document_chunk_embedding"("chunkId", "model");

-- AddForeignKey
ALTER TABLE "document_chunk" ADD CONSTRAINT "document_chunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_chunk_embedding" ADD CONSTRAINT "document_chunk_embedding_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "document_chunk"("id") ON DELETE CASCADE ON UPDATE CASCADE;
