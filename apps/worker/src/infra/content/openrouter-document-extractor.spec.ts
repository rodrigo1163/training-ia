import { describe, expect, it, vi } from 'vitest'

import type { EnvService } from '../env/env.service.js'
import { OpenRouterDocumentExtractor } from './openrouter-document-extractor.js'
import { LocalDocumentExtractor } from './local-document-extractor.js'

const { invoke, withStructuredOutput } = vi.hoisted(() => ({
  invoke: vi.fn(),
  withStructuredOutput: vi.fn(),
}))

vi.mock('@langchain/openai', () => ({
  ChatOpenAI: class {
    withStructuredOutput = withStructuredOutput
  },
}))

function createExtractor() {
  withStructuredOutput.mockReturnValue({ invoke })

  const envService = {
    get: vi.fn(() => 'test-openrouter-key'),
  } as unknown as EnvService

  return new OpenRouterDocumentExtractor(envService, new LocalDocumentExtractor())
}

describe('Document extraction', () => {
  it('extracts TXT content as Markdown', async () => {
    const result = await createExtractor().extract({
      contentType: 'text/plain',
      body: Buffer.from('# Title\n\nDocument text.', 'utf8'),
    })

    expect(result.markdown).toBe('# Title\n\nDocument text.')
  })

  it('converts HTML content to Markdown', async () => {
    const result = await createExtractor().extract({
      contentType: 'text/html',
      body: Buffer.from('<h1>Title</h1><p>Document text.</p>', 'utf8'),
    })

    expect(result.markdown).toBe('# Title\n\nDocument text.')
  })

  it('normalizes null bytes, line endings and excessive blank lines', async () => {
    const result = await createExtractor().extract({
      contentType: 'text/plain',
      body: Buffer.from('\u0000First\r\n\r\n\r\nSecond  ', 'utf8'),
    })

    expect(result.markdown).toBe('First\n\nSecond')
  })

  it('sends PDFs to OpenRouter as base64 files and returns the generated Markdown', async () => {
    const body = Buffer.from('%PDF-test-content', 'utf8')
    invoke.mockResolvedValueOnce({ markdown: '# AI document\n' })

    const result = await createExtractor().extract({
      contentType: 'application/pdf',
      body,
    })

    expect(result.markdown).toBe('# AI document')
    expect(invoke).toHaveBeenCalledWith([
      expect.objectContaining({
        content: [
          expect.objectContaining({ type: 'text' }),
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
  })

  it('rejects an empty Markdown response from OpenRouter', async () => {
    invoke.mockResolvedValueOnce({ markdown: '   ' })

    await expect(
      createExtractor().extract({
        contentType: 'application/pdf',
        body: Buffer.from('%PDF-test-content', 'utf8'),
      }),
    ).rejects.toThrow('Document extraction produced no text')
  })

  it('rejects unsupported document types', async () => {
    await expect(
      createExtractor().extract({
        contentType: 'application/octet-stream',
        body: Buffer.from('content'),
      }),
    ).rejects.toThrow('Unsupported document content type')
  })
})
