export const INGESTION_CONFIG = {
  chunkSize: 1000,
  chunkOverlap: 200,
  embeddingBatchSize: 64,
  topK: 8,
  // Hit útil típico do text-embedding-3-small fica ~0.30–0.65.
  // 0.70 descartava perguntas genéricas ("explique o currículo").
  similarityThreshold: 0.25,
  // Se nada passar do limiar, ainda devolve os melhores chunks
  // acima deste piso para cobrir perguntas amplas sobre o documento.
  similarityFallbackFloor: 0.15,
  maxPdfBytes: 10 * 1024 * 1024,
  maxPages: 200,
  maxExtractedCharacters: 2_000_000,
  maxChunksPerSource: 5_000,
  minChunkCharacters: 20,
  maxContextCharacters: 12_000,
  maxChatMessages: 20,
  maxMessageCharacters: 4_000,
} as const
