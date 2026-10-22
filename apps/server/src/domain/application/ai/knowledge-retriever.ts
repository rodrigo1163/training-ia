export interface KnowledgeChunk {
  documentId: string;
  chunkId: string;
  documentName: string;
  text: string;
  score: number;
}

export abstract class KnowledgeRetriever {
  abstract retrieve(input: {
    botId: string;
    query: string;
    limit?: number;
  }): Promise<KnowledgeChunk[]>;
}
