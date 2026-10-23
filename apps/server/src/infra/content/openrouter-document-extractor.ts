import { Injectable } from '@nestjs/common'
import { HumanMessage } from '@langchain/core/messages'
import type { BaseLanguageModelInput } from '@langchain/core/language_models/base'
import type { Runnable } from '@langchain/core/runnables'
import { ChatOpenAI } from '@langchain/openai'
import { z } from 'zod'

import {
  DocumentExtractor,
  type ExtractDocumentInput,
  type ExtractedDocumentContent,
} from '@/domain/application/content/document-extractor'
import { htmlToMarkdown, textToMarkdown } from './markdown-content'
import { EnvService } from '../env/env.service'
import { LocalDocumentExtractor } from './local-document-extractor'

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
const OPENROUTER_DOCUMENT_MODEL = 'openai/gpt-4o-mini'

const documentMarkdownSchema = z.object({
  markdown: z.string(),
})
type DocumentMarkdownResult = z.infer<typeof documentMarkdownSchema>

const DOCUMENT_MARKDOWN_PROMPT = `Convert the attached PDF into Markdown.

Requirements:
- Return the complete document content, not a summary.
- Preserve the original text, headings, lists, tables, links, and page order.
- Preserve meaningful line breaks, paragraph boundaries, and the original spacing between text blocks as faithfully as possible.
- Separate each paragraph with one blank line in the Markdown output.
- Do not invent, omit, or rewrite information.
- Return only the Markdown content inside the structured markdown field.
- Do not wrap the Markdown in a code fence.`

@Injectable()
export class OpenRouterDocumentExtractor implements DocumentExtractor {
  private readonly client: Runnable<
    BaseLanguageModelInput,
    DocumentMarkdownResult
  >

  constructor(
    envService: EnvService,
    private readonly localDocumentExtractor: LocalDocumentExtractor,
  ) {
    const model = new ChatOpenAI({
      apiKey: envService.get('OPENROUTER_API_KEY'),
      model: OPENROUTER_DOCUMENT_MODEL,
      configuration: {
        baseURL: OPENROUTER_BASE_URL,
      },
    })

    this.client = model.withStructuredOutput<DocumentMarkdownResult>(
      documentMarkdownSchema,
      {
        name: 'convert_document_to_markdown',
        strict: true,
        includeRaw: false,
      },
    )
  }

  async extract({
    contentType,
    body,
  }: ExtractDocumentInput): Promise<ExtractedDocumentContent> {
    const markdown = await this.extractToMarkdown(contentType, body)

    if (markdown.length === 0) {
      throw new Error('Document extraction produced no text')
    }

    return { markdown }
  }

  private async extractToMarkdown(
    contentType: string,
    body: Buffer,
  ): Promise<string> {
    if (contentType === 'text/plain') {
      return textToMarkdown(body.toString('utf8'))
    }

    if (contentType === 'text/html') {
      return htmlToMarkdown(body.toString('utf8'))
    }

    if (contentType === 'application/pdf') {
      const result = await this.client.invoke([
        new HumanMessage({
          content: [
            {
              type: 'text',
              text: DOCUMENT_MARKDOWN_PROMPT,
            },
            {
              type: 'file',
              source_type: 'base64',
              data: body.toString('base64'),
              mime_type: 'application/pdf',
              metadata: {
                filename: 'document.pdf',
              },
            },
          ],
        }),
      ])

      return result.markdown.trim()
    }

    if (
      contentType === 'application/msword' ||
      contentType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return (
        await this.localDocumentExtractor.extract({ contentType, body })
      ).markdown
    }

    throw new Error(`Unsupported document content type: ${contentType}`)
  }
}
