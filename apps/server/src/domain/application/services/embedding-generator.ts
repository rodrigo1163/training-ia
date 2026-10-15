export abstract class EmbeddingGenerator {
  abstract embedQuery(text: string): Promise<number[]>;
}
