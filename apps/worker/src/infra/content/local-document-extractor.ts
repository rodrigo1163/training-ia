import { Injectable } from '@nestjs/common'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

import {
  DocumentExtractor,
  type ExtractDocumentInput,
  type ExtractedDocumentContent,
} from '../../domain/application/content/document-extractor.js'
import { htmlToMarkdown, textToMarkdown } from './markdown-content.js'

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
      return this.extractPdfToMarkdown(body)
    }

    throw new Error(`Unsupported document content type: ${contentType}`)
  }

  private async extractPdfToMarkdown(body: Buffer): Promise<string> {
    const loadingTask = getDocument({ data: new Uint8Array(body) })

    try {
      const document = await loadingTask.promise
      const pages: string[] = []

      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
        const page = await document.getPage(pageNumber)
        const content = await page.getTextContent()

        const pageText = content.items
          .map((item) => {
            if (!('str' in item)) {
              return ''
            }

            return item.str + (item.hasEOL ? '\n' : ' ')
          })
          .join('')

        pages.push(pageText)
      }

      return textToMarkdown(pages.join('\n\n'))
    } finally {
      await loadingTask.destroy()
    }
  }
}
