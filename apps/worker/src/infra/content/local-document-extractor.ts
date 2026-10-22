import { Injectable } from '@nestjs/common'
import { toMarkdown } from '@mdgate/pdf'

import {
  DocumentExtractor,
  type ExtractDocumentInput,
  type ExtractedDocumentContent,
} from '../../domain/application/content/document-extractor.js'
import {
  htmlToMarkdown,
  normalizePdfMarkdown,
  textToMarkdown,
} from './markdown-content.js'

@Injectable()
export class LocalDocumentExtractor implements DocumentExtractor {
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

  private async extractToMarkdown(
    contentType: string,
    body: Buffer,
  ): Promise<string> {
    if (contentType === 'text/plain') {
      return textToMarkdown(body.toString('utf8'))
    }

    if (contentType === 'text/html') {
      return htmlToMarkdown(body.toString('utf8'))
    }

    if (contentType === 'application/pdf') {
      return normalizePdfMarkdown(await toMarkdown(new Uint8Array(body)))
    }

    throw new Error(`Unsupported document content type: ${contentType}`)
  }
}
