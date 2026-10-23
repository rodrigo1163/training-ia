import { Logger } from '@nestjs/common'
import mammoth from 'mammoth'
import { gfm } from '@truto/turndown-plugin-gfm'
import * as cheerio from 'cheerio'
import TurndownService from 'turndown'

import { normalizeMarkdown } from './markdown-content'

const logger = new Logger('DocxToMarkdown')
const dangerousTags =
  'script, style, iframe, object, embed, svg, form, noscript, template, canvas'
const dangerousUrlScheme = /^[a-z][a-z\d+.-]*:/i
const safeUrlScheme = /^(?:https?|mailto):/i

export async function docxToMarkdown(body: Buffer): Promise<string> {
  const result = await mammoth.convertToHtml(
    { buffer: body },
    {
      externalFileAccess: false,
      includeEmbeddedStyleMap: false,
    },
  )

  const errorCount = result.messages.filter(
    (message) => message.type === 'error',
  ).length

  if (errorCount > 0) {
    throw new Error(`DOCX conversion failed with ${errorCount} error message(s)`)
  }

  const warningCount = result.messages.filter(
    (message) => message.type === 'warning',
  ).length

  if (warningCount > 0) {
    logger.warn(`DOCX conversion emitted ${warningCount} warning message(s)`)
  }

  const sanitizedHtml = sanitizeDocxHtml(result.value)
  const turndown = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
  })

  turndown.use(gfm)

  return normalizeMarkdown(turndown.turndown(sanitizedHtml))
}

function sanitizeDocxHtml(input: string): string {
  const $ = cheerio.load(input)

  $(dangerousTags).remove()

  $('img').each((_, element) => {
    const alternativeText = $(element).attr('alt')?.trim()

    if (alternativeText) {
      $(element).replaceWith($('<span>').text(alternativeText))
    } else {
      $(element).remove()
    }
  })

  $('*').each((_, element) => {
    if (!('attribs' in element)) {
      return
    }

    for (const attribute of Object.keys(element.attribs)) {
      const normalizedAttribute = attribute.toLowerCase()

      if (normalizedAttribute.startsWith('on')) {
        $(element).removeAttr(attribute)
        continue
      }

      if (normalizedAttribute === 'style') {
        $(element).removeAttr(attribute)
        continue
      }

      if (normalizedAttribute === 'href') {
        const href = $(element).attr(attribute)

        if (href && !isSafeUrl(href)) {
          $(element).removeAttr(attribute)
        }
      }
    }
  })

  return $('body').html() ?? $.root().html() ?? ''
}

function isSafeUrl(value: string): boolean {
  const normalizedValue = value
    .trim()
    .split('')
    .filter((character) => {
      const code = character.charCodeAt(0)

      return !(code <= 0x1f || (code >= 0x7f && code <= 0x9f))
    })
    .join('')

  if (!normalizedValue) {
    return false
  }

  if (
    normalizedValue.toLowerCase().startsWith('javascript:') ||
    normalizedValue.toLowerCase().startsWith('data:') ||
    normalizedValue.toLowerCase().startsWith('vbscript:')
  ) {
    return false
  }

  return (
    safeUrlScheme.test(normalizedValue) || !dangerousUrlScheme.test(normalizedValue)
  )
}
