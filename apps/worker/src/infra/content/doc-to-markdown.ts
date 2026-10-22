import { toMarkdown } from '@mdgate/doc'

import { normalizeMarkdown } from './markdown-content.js'

export async function docToMarkdown(body: Buffer): Promise<string> {
  const markdown = await toMarkdown(new Uint8Array(body))

  return normalizeMarkdown(markdown)
}
