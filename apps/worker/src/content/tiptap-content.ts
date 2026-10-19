import type { JSONContent } from '@tiptap/core'
import { generateJSON } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'

export type TiptapDocument = JSONContent & {
  type: 'doc'
  content: JSONContent[]
}

const extensions = [StarterKit]

export function textToTiptap(input: string): TiptapDocument {
  const normalized = input.split('\u0000').join('').replace(/\r\n?/g, '\n').trim()
  const blocks = normalized.length === 0 ? [] : normalized.split(/\n{2,}/)
  const content: JSONContent[] = []

  for (const block of blocks) {
    const lines = block.split('\n')
    const heading = lines.length === 1 ? /^(#{1,6})\s+(.+)$/.exec(lines[0]) : null

    if (heading) {
      content.push({
        type: 'heading',
        attrs: { level: heading[1].length },
        content: [{ type: 'text', text: heading[2].trim() }],
      })
      continue
    }

    if (lines.every((line) => /^\s*[-*+]\s+.+$/.test(line))) {
      content.push({
        type: 'bulletList',
        content: lines.map((line) => ({
          type: 'listItem',
          content: [paragraph(line.replace(/^\s*[-*+]\s+/, ''))],
        })),
      })
      continue
    }

    if (lines.every((line) => /^\s*\d+[.)]\s+.+$/.test(line))) {
      content.push({
        type: 'orderedList',
        attrs: { start: 1 },
        content: lines.map((line) => ({
          type: 'listItem',
          content: [paragraph(line.replace(/^\s*\d+[.)]\s+/, ''))],
        })),
      })
      continue
    }

    content.push(paragraph(block.trim()))
  }

  return { type: 'doc', content }
}

export function htmlToTiptap(html: string): TiptapDocument {
  return generateJSON(html, extensions) as TiptapDocument
}

export function isTiptapDocument(value: unknown): value is TiptapDocument {
  if (!isRecord(value) || value.type !== 'doc' || !Array.isArray(value.content)) {
    return false
  }

  return value.content.every(isTiptapNode)
}

export function tiptapToPlainText(document: TiptapDocument): string {
  return serializeNode(document)
    .split('\u0000').join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function paragraph(text: string): JSONContent {
  return {
    type: 'paragraph',
    content: text.length > 0 ? [{ type: 'text', text }] : undefined,
  }
}

function serializeNode(node: JSONContent): string {
  if (node.type === 'text') {
    return node.text ?? ''
  }

  const children = (node.content ?? []).map(serializeNode)

  if (node.type === 'doc') {
    return children.filter(Boolean).join('\n\n')
  }

  if (node.type === 'listItem') {
    return children.filter(Boolean).join('\n')
  }

  if (node.type === 'bulletList' || node.type === 'orderedList') {
    return children.filter(Boolean).join('\n\n')
  }

  return children.join('')
}

function isTiptapNode(value: unknown): value is JSONContent {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return false
  }

  if (value.text !== undefined && typeof value.text !== 'string') {
    return false
  }

  return value.content === undefined ||
    (Array.isArray(value.content) && value.content.every(isTiptapNode))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
