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
      return this.extractPdfText(body)
    }

    throw new Error(`Unsupported document content type: ${contentType}`)
  }

  private async extractPdfText(body: Buffer): Promise<string> {
    const loadingTask = getDocument({ data: new Uint8Array(body) })

    try {
      const document = await loadingTask.promise
      const pages: string[] = []

      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
        const page = await document.getPage(pageNumber)
        const content = await page.getTextContent()
        let currentLine = ''
        const lines: string[] = []

        for (const item of content.items) {
          if (!('str' in item)) {
            continue
          }

          currentLine += item.str

          if (item.hasEOL) {
            this.pushLine(lines, currentLine)
            currentLine = ''
          }
        }

        this.pushLine(lines, currentLine)
        pages.push(lines.join('\n'))
      }

      return textToMarkdown(pages.join('\n\n'))
    } finally {
      await loadingTask.destroy()
    }
  }

  private pushLine(lines: string[], line: string): void {
    const normalizedLine = line.replace(/\s+/g, ' ').trim()

    if (normalizedLine.length > 0) {
      lines.push(normalizedLine)
    }
  }
}
