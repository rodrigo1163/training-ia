import { toMarkdownBytes } from '@firecrawl/anydoc'
import { normalizeMarkdown } from './markdown-content.js'

export async function docToMarkdown(
  body: Buffer,
): Promise<string> {
  const markdown = await toMarkdownBytes(
    new Uint8Array(body),
  )

  return normalizeMarkdown(markdown)
}