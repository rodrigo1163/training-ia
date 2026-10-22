import { Injectable } from '@nestjs/common'
import { toMarkdown } from '@mdgate/pdf'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

import {
  DocumentExtractor,
  type ExtractDocumentInput,
  type ExtractedDocumentContent,
} from '../../domain/application/content/document-extractor.js'
import {
  htmlToMarkdown,
  normalizeMarkdown,
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
      const bytes = new Uint8Array(body)
      const markdown = normalizePdfMarkdown(await toMarkdown(bytes))
      const lines = await this.extractPdfLines(bytes)

      return normalizeMarkdown(preservePdfLineBreaks(markdown, lines))
    }

    throw new Error(`Unsupported document content type: ${contentType}`)
  }

  private async extractPdfLines(body: Uint8Array): Promise<string[]> {
    const loadingTask = getDocument({ data: body })

    try {
      const document = await loadingTask.promise
      const lines: string[] = []

      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
        const page = await document.getPage(pageNumber)
        const content = await page.getTextContent()
        let currentLine = ''

        for (const item of content.items) {
          if (!('str' in item)) {
            continue
          }

          currentLine += item.str

          if (item.hasEOL) {
            this.pushPdfLine(lines, currentLine)
            currentLine = ''
          }
        }

        this.pushPdfLine(lines, currentLine)
      }

      return lines
    } catch (error) {
      console.warn(
        '[worker] Failed to read PDF line breaks; keeping Markdown output',
        error,
      )
      return []
    } finally {
      await loadingTask.destroy()
    }
  }

  private pushPdfLine(lines: string[], line: string): void {
    const normalizedLine = line.replace(/\s+/g, ' ').trim()

    if (normalizedLine.length > 0) {
      lines.push(normalizedLine)
    }
  }
}

function preservePdfLineBreaks(markdown: string, pdfLines: string[]): string {
  let result = markdown
  let searchIndex = 0

  for (const rawLine of pdfLines) {
    const isBulletLine = /^[-\u2022\u25cf\u25cb\u25e6\u25aa\u25ab\u2023\u2043*]\s+/.test(
      rawLine,
    )
    const line = isBulletLine
      ? rawLine.replace(/^[-\u2022\u25cf\u25cb\u25e6\u25aa\u25ab\u2023\u2043*]\s+/, '')
      : rawLine

    if (line.length === 0) {
      continue
    }

    const boundary = findMarkdownTextBoundary(result, line, searchIndex)

    if (boundary === null) {
      continue
    }

    searchIndex = boundary

    if (result.startsWith('**', boundary)) {
      continue
    }

    if (result[boundary] === '\n') {
      if (!isMarkdownListLine(result, boundary) && result[boundary + 1] !== '\n') {
        result = result.slice(0, boundary) + '\n' + result.slice(boundary)
        searchIndex = boundary + 2
      }

      continue
    }

    if (result[boundary] === ' ') {
      result = result.slice(0, boundary) + '\n\n' + result.slice(boundary + 1)
      searchIndex = boundary + 2
    } else {
      result = result.slice(0, boundary) + '\n' + result.slice(boundary)
      searchIndex = boundary + 1
    }
  }

  return result
}

function isMarkdownListLine(markdown: string, boundary: number): boolean {
  const lineStart = markdown.lastIndexOf('\n', boundary - 1) + 1

  return /^[-*+]\s/.test(markdown.slice(lineStart, boundary))
}

function findMarkdownTextBoundary(
  markdown: string,
  text: string,
  minimumIndex: number,
): number | null {
  const plainCharacters: string[] = []
  const originalPositions: number[] = []

  for (let index = 0; index < markdown.length; index++) {
    if (markdown.startsWith('**', index)) {
      index += 1
      continue
    }

    plainCharacters.push(markdown[index])
    originalPositions.push(index)
  }

  const plainStart = originalPositions.findIndex(
    (position) => position >= minimumIndex,
  )
  const plainText = plainCharacters.join('')
  const matchIndex = plainText.indexOf(text, plainStart === -1 ? 0 : plainStart)

  if (matchIndex === -1) {
    return null
  }

  const lastCharacterPosition = originalPositions[matchIndex + text.length - 1]

  return lastCharacterPosition + 1
}
