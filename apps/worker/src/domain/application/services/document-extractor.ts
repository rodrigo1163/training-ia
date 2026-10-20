import type { TiptapDocument } from '../../enterprise/value-objects/tiptap-document.js'

export interface ExtractDocumentInput {
  contentType: string
  body: Buffer
}

export interface ExtractedDocumentContent {
  content: TiptapDocument
  text: string
}

export abstract class DocumentExtractor {
  abstract extract(input: ExtractDocumentInput): Promise<ExtractedDocumentContent>
}
