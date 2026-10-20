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
