export abstract class EmbeddingGenerator {
  abstract readonly model: string;
  abstract readonly dimensions: number;

  abstract embedDocuments(documents: string[]): Promise<number[][]>;
}
