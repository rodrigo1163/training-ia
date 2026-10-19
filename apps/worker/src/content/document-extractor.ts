import { extractText, getDocumentProxy } from 'unpdf'

import {
  htmlToTiptap,
  textToTiptap,
  tiptapToPlainText,
  type TiptapDocument,
} from './tiptap-content.js'

export interface DocumentExtractionInput {
  contentType: string
  body: Buffer
}

export interface ExtractedDocumentContent {
  content: TiptapDocument
  text: string
}

export async function extractDocumentContent({
  contentType,
  body,
}: DocumentExtractionInput): Promise<ExtractedDocumentContent> {
  const content = await extractToTiptap(contentType, body)
  const text = tiptapToPlainText(content)

  if (text.length === 0) {
    throw new Error('Document extraction produced no text')
  }

  return { content, text }
}

async function extractToTiptap(
  contentType: string,
  body: Buffer,
): Promise<TiptapDocument> {
  if (contentType === 'text/plain') {
    return textToTiptap(body.toString('utf8'))
  }

  if (contentType === 'text/html') {
    return htmlToTiptap(stripUnsafeHtml(body.toString('utf8')))
  }

  if (contentType === 'application/pdf') {
    const pdf = await getDocumentProxy(new Uint8Array(body))
    const extracted = await extractText(pdf, { mergePages: true })
    const text = extracted.text

    return textToTiptap(text)
  }

  throw new Error(`Unsupported document content type: ${contentType}`)
}

function stripUnsafeHtml(html: string): string {
  return html.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
}
