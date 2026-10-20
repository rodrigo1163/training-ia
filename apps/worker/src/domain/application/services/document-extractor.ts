export interface ExtractDocumentInput {
  contentType: string
  body: Buffer
}

export interface ExtractedDocumentContent {
  markdown: string
}

export abstract class DocumentExtractor {
  abstract extract(input: ExtractDocumentInput): Promise<ExtractedDocumentContent>
}
