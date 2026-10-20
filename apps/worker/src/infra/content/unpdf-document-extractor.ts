import { Injectable } from '@nestjs/common'
import { extractText, getDocumentProxy } from 'unpdf'

import {
  DocumentExtractor,
  type ExtractDocumentInput,
  type ExtractedDocumentContent,
} from '../../domain/application/services/document-extractor.js'
import { htmlToMarkdown, textToMarkdown } from './markdown-content.js'

@Injectable()
export class UnpdfDocumentExtractor implements DocumentExtractor {
  async extract({
    contentType,
    body,
  }: ExtractDocumentInput): Promise<ExtractedDocumentContent> {
    const markdown = await this.extractToMarkdown(contentType, body)

    if (markdown.length === 0) {
      throw new Error('Document extraction produced no text')
    }

    return { markdown }
  }

  private async extractToMarkdown(contentType: string, body: Buffer) {
    if (contentType === 'text/plain') {
      return textToMarkdown(body.toString('utf8'))
    }

    if (contentType === 'text/html') {
      return htmlToMarkdown(body.toString('utf8'))
    }

    if (contentType === 'application/pdf') {
      const pdf = await getDocumentProxy(new Uint8Array(body))
      const extracted = await extractText(pdf, { mergePages: true })

      return textToMarkdown(extracted.text)
    }

    throw new Error(`Unsupported document content type: ${contentType}`)
  }

}
