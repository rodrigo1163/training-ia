import type { JSONContent } from '@tiptap/core'

export type TiptapDocument = JSONContent & {
  type: 'doc'
  content: JSONContent[]
}

export function isTiptapDocument(value: unknown): value is TiptapDocument {
  if (!isRecord(value) || value.type !== 'doc' || !Array.isArray(value.content)) {
    return false
  }

  return value.content.every(isTiptapNode)
}

export function tiptapToPlainText(document: TiptapDocument): string {
  return serializeNode(document)
    .split('\u0000')
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
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

  return (
    value.content === undefined ||
    (Array.isArray(value.content) && value.content.every(isTiptapNode))
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
