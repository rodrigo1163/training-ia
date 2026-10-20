import type { TiptapDocument } from '../value-objects/tiptap-document.js'

export interface ProcessingDocumentContent {
  content: TiptapDocument
  text: string
  version: number
}

export interface ProcessingDocumentProps {
  id: string
  botId: string
  storageKey: string
  contentType: string
  content?: ProcessingDocumentContent
}

export class ProcessingDocument {
  constructor(readonly props: ProcessingDocumentProps) {}

  get id(): string {
    return this.props.id
  }

  get botId(): string {
    return this.props.botId
  }

  get storageKey(): string {
    return this.props.storageKey
  }

  get contentType(): string {
    return this.props.contentType
  }

  get content(): ProcessingDocumentContent | undefined {
    return this.props.content
  }
}
