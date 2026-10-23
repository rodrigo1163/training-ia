export abstract class TextSplitter {
  abstract split(text: string): Promise<string[]>;
}
