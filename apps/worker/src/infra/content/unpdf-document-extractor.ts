import { Injectable } from '@nestjs/common'
import { extractText, getDocumentProxy } from 'unpdf'

import {
  DocumentExtractor,
  type ExtractDocumentInput,
  type ExtractedDocumentContent,
} from '../../domain/application/services/document-extractor.js'
import { tiptapToPlainText } from '../../domain/enterprise/value-objects/tiptap-document.js'
import { htmlToTiptap, textToTiptap } from './tiptap-content.js'

@Injectable()
export class UnpdfDocumentExtractor implements DocumentExtractor {
  async extract({
    contentType,
    body,
  }: ExtractDocumentInput): Promise<ExtractedDocumentContent> {
    const content = await this.extractToTiptap(contentType, body)
    const text = tiptapToPlainText(content)

    if (text.length === 0) {
      throw new Error('Document extraction produced no text')
    }

    return { content, text }
  }

  private async extractToTiptap(contentType: string, body: Buffer) {
    if (contentType === 'text/plain') {
      return textToTiptap(body.toString('utf8'))
    }

    if (contentType === 'text/html') {
      return htmlToTiptap(this.stripUnsafeHtml(body.toString('utf8')))
    }

    if (contentType === 'application/pdf') {
      const pdf = await getDocumentProxy(new Uint8Array(body))
      const extracted = await extractText(pdf, { mergePages: true })

      return textToTiptap(extracted.text)
    }

    throw new Error(`Unsupported document content type: ${contentType}`)
  }

  private stripUnsafeHtml(html: string): string {
    return html.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
  }
}
