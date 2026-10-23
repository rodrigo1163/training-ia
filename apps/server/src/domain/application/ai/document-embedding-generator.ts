export abstract class DocumentEmbeddingGenerator {
  abstract readonly model: string;
  abstract readonly dimensions: number;

  abstract embedDocuments(documents: string[]): Promise<number[][]>;
}
