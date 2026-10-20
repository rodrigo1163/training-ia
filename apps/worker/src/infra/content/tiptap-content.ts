import type { JSONContent } from '@tiptap/core'
import { generateJSON } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'

import type { TiptapDocument } from '../../domain/enterprise/value-objects/tiptap-document.js'

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

function paragraph(text: string): JSONContent {
  return {
    type: 'paragraph',
    content: text.length > 0 ? [{ type: 'text', text }] : undefined,
  }
}
