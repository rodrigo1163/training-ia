import { normalizeMarkdown } from './markdown-content'

type MdGateDoc = typeof import('@mdgate/doc')

const importEsm = new Function(
  'specifier',
  'return import(specifier)',
) as (specifier: string) => Promise<MdGateDoc>

export async function docToMarkdown(body: Buffer): Promise<string> {
  const { toMarkdown } = await importEsm('@mdgate/doc')
  const markdown = await toMarkdown(new Uint8Array(body))

  return normalizeMarkdown(markdown)
}
