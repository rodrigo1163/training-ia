import * as cheerio from 'cheerio'

const BLOCK_TAGS = new Set([
  'address',
  'article',
  'blockquote',
  'div',
  'dl',
  'dt',
  'dd',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'hr',
  'main',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'table',
  'ul',
])

type HtmlNode = {
  type: string
  data?: string
  name?: string
  children?: HtmlNode[]
}

export function textToMarkdown(input: string): string {
  return normalizeMarkdown(input)
}

export function normalizePdfMarkdown(input: string): string {
  const lines = input.split(/\r?\n/)
  const normalizedLines: string[] = []

  for (let index = 0; index < lines.length; ) {
    const headerRow = parseMarkdownTableRow(lines[index])
    const separatorRow = lines[index + 1]

    if (
      headerRow &&
      isBulletMarker(headerRow[0]) &&
      separatorRow &&
      isMarkdownTableSeparator(separatorRow)
    ) {
      const items = [headerRow.slice(1).join(' | ').trim()]
      let nextIndex = index + 2

      while (nextIndex < lines.length) {
        const row = parseMarkdownTableRow(lines[nextIndex])

        if (!row || !isBulletMarker(row[0])) {
          break
        }

        items.push(row.slice(1).join(' | ').trim())
        nextIndex += 1
      }

      normalizedLines.push(...items.map((item) => `- ${item}`))
      index = nextIndex
      continue
    }

    normalizedLines.push(lines[index])
    index += 1
  }

  return normalizeMarkdown(normalizedLines.join('\n'))
}

export function htmlToMarkdown(input: string): string {
  const $ = cheerio.load(input)
  $(
    'script, style, noscript, svg, template, iframe, canvas, nav, footer, aside, form, [hidden], [aria-hidden="true"]',
  ).remove()

  const contentNode =
    ['main', 'article', 'body']
      .map((selector) =>
        $(selector)
          .filter((_, element) => $(element).text().trim().length > 0)
          .first()
          .get(0),
      )
      .find((node) => node !== undefined) ?? $.root().get(0)

  if (!contentNode) {
    return ''
  }

  return normalizeMarkdown(renderNode(contentNode as unknown as HtmlNode))
}

export function normalizeMarkdown(input: string): string {
  return input
    .split('\u0000').join('')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function parseMarkdownTableRow(line: string | undefined): string[] | null {
  if (!line) {
    return null
  }

  const trimmedLine = line.trim()

  if (!trimmedLine.startsWith('|') || !trimmedLine.endsWith('|')) {
    return null
  }

  return trimmedLine
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim())
}

function isMarkdownTableSeparator(line: string): boolean {
  const cells = parseMarkdownTableRow(line)

  return (
    cells !== null &&
    cells.length >= 2 &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell))
  )
}

function isBulletMarker(cell: string | undefined): boolean {
  return cell !== undefined && /^[-•●○◦▪▫‣⁃*]$/.test(cell)
}

function renderNode(node: HtmlNode): string {
  if (node.type === 'text') {
    return (node.data ?? '').replace(/\s+/g, ' ')
  }

  const tag = node.name?.toLowerCase()
  const content = (node.children ?? []).map(renderNode).join('')

  if (!content.trim() && tag !== 'br' && tag !== 'hr') {
    return ''
  }

  if (tag === 'br') {
    return '\n'
  }

  if (tag === 'hr') {
    return '\n\n---\n\n'
  }

  if (tag && /^h[1-6]$/.test(tag)) {
    return `\n\n${'#'.repeat(Number(tag[1]))} ${content.trim()}\n\n`
  }

  if (tag === 'li') {
    return `\n- ${content.trim()}`
  }

  if (tag === 'blockquote') {
    return `\n\n${content
      .trim()
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n')}\n\n`
  }

  if (tag === 'pre') {
    return '\n\n' + '```' + '\n' + content.trim() + '\n' + '```' + '\n\n'
  }

  if (tag && BLOCK_TAGS.has(tag)) {
    return `\n\n${content.trim()}\n\n`
  }

  return content
}
