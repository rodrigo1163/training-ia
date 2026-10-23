import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LocalDocumentExtractor } from './local-document-extractor.js'

const { getDocument } = vi.hoisted(() => ({
  getDocument: vi.fn(),
}))

const { convertToHtml } = vi.hoisted(() => ({
  convertToHtml: vi.fn(),
}))

const { toMarkdown } = vi.hoisted(() => ({
  toMarkdown: vi.fn(),
}))

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument,
}))

vi.mock('mammoth', () => ({
  default: { convertToHtml },
}))

vi.mock('@mdgate/doc', () => ({
  toMarkdown,
}))

describe('LocalDocumentExtractor', () => {
  beforeEach(() => {
    getDocument.mockReset()
    convertToHtml.mockReset()
    toMarkdown.mockReset()
    getDocument.mockReturnValue({
      promise: Promise.resolve({ numPages: 0 }),
      destroy: vi.fn().mockResolvedValue(undefined),
    })
  })

  it('extracts TXT content as Markdown without using a PDF extractor', async () => {
    const result = await new LocalDocumentExtractor().extract({
      contentType: 'text/plain',
      body: Buffer.from('# Title\n\nDocument text.', 'utf8'),
    })

    expect(result.markdown).toBe('# Title\n\nDocument text.')
    expect(getDocument).not.toHaveBeenCalled()
  })

  it('converts HTML content to Markdown without using a PDF extractor', async () => {
    const result = await new LocalDocumentExtractor().extract({
      contentType: 'text/html',
      body: Buffer.from('<h1>Title</h1><p>Document text.</p>', 'utf8'),
    })

    expect(result.markdown).toBe('# Title\n\nDocument text.')
    expect(getDocument).not.toHaveBeenCalled()
  })

  it('extracts PDF text in page and line order without formatting it', async () => {
    const body = Buffer.from('%PDF-test-content', 'utf8')
    const destroy = vi.fn().mockResolvedValue(undefined)
    const getPage = vi.fn()

    getPage
      .mockResolvedValueOnce({
        getTextContent: vi.fn().mockResolvedValue({
          items: [
            { str: 'First', hasEOL: false },
            { str: ' page', hasEOL: true },
            { str: '|A|B|', hasEOL: true },
          ],
        }),
      })
      .mockResolvedValueOnce({
        getTextContent: vi.fn().mockResolvedValue({
          items: [{ str: 'Second page', hasEOL: true }],
        }),
      })

    getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 2,
        getPage,
      }),
      destroy,
    })

    const result = await new LocalDocumentExtractor().extract({
      contentType: 'application/pdf',
      body,
    })

    expect(result.markdown).toBe('First page\n|A|B|\n\nSecond page')
    expect(getDocument).toHaveBeenCalledWith({ data: new Uint8Array(body) })
    expect(getPage).toHaveBeenNthCalledWith(1, 1)
    expect(getPage).toHaveBeenNthCalledWith(2, 2)
    expect(destroy).toHaveBeenCalledOnce()
  })

  it('rejects a PDF without extractable text', async () => {
    const destroy = vi.fn().mockResolvedValue(undefined)

    getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({ items: [] }),
        }),
      }),
      destroy,
    })

    await expect(
      new LocalDocumentExtractor().extract({
        contentType: 'application/pdf',
        body: Buffer.from('%PDF-empty', 'utf8'),
      }),
    ).rejects.toThrow('Document extraction produced no text')

    expect(destroy).toHaveBeenCalledOnce()
  })

  it('rejects unsupported document types', async () => {
    await expect(
      new LocalDocumentExtractor().extract({
        contentType: 'application/octet-stream',
        body: Buffer.from('content'),
      }),
    ).rejects.toThrow('Unsupported document content type')

    expect(getDocument).not.toHaveBeenCalled()
  })

  it('converts DOC through @mdgate/doc', async () => {
    const body = Buffer.from('doc-binary')
    toMarkdown.mockResolvedValueOnce('# Title\n\nDocument text.\n')

    const result = await new LocalDocumentExtractor().extract({
      contentType: 'application/msword',
      body,
    })

    expect(toMarkdown).toHaveBeenCalledWith(new Uint8Array(body))
    expect(result.markdown).toBe('# Title\n\nDocument text.')
  })

  it('converts DOCX through Mammoth HTML and Turndown GFM', async () => {
    const body = Buffer.from('docx-binary')
    convertToHtml.mockResolvedValueOnce({
      value: `
        <h1>Title</h1>
        <p>A <strong>bold</strong> paragraph with <a href="https://example.com">a link</a>.</p>
        <ul><li>First item</li><li>Second item</li></ul>
        <table><thead><tr><th>Name</th></tr></thead><tbody><tr><td>Jane</td></tr></tbody></table>
      `,
      messages: [],
    })

    const result = await new LocalDocumentExtractor().extract({
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      body,
    })

    expect(convertToHtml).toHaveBeenCalledWith(
      { buffer: body },
      expect.objectContaining({
        externalFileAccess: false,
        includeEmbeddedStyleMap: false,
      }),
    )
    expect(result.markdown).toContain('# Title')
    expect(result.markdown).toContain('A **bold** paragraph with [a link](https://example.com).')
    expect(result.markdown).toContain('-   First item')
    expect(result.markdown).toContain('| Name |')
    expect(result.markdown).not.toContain('<table>')
  })

  it('rejects DOCX content with no text', async () => {
    convertToHtml.mockResolvedValueOnce({ value: '<p> </p>', messages: [] })

    await expect(
      new LocalDocumentExtractor().extract({
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        body: Buffer.from('docx-binary'),
      }),
    ).rejects.toThrow('Document extraction produced no text')
  })

  it('rejects DOCX conversion messages with errors without logging document content', async () => {
    convertToHtml.mockResolvedValueOnce({
      value: '<p>Private document text</p>',
      messages: [
        {
          type: 'error',
          message: 'Private document text should not be logged',
          error: new Error('conversion failed'),
        },
      ],
    })

    await expect(
      new LocalDocumentExtractor().extract({
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        body: Buffer.from('docx-binary'),
      }),
    ).rejects.toThrow('DOCX conversion failed')
  })

  it('sanitizes dangerous HTML and removes base64 images from DOCX Markdown', async () => {
    convertToHtml.mockResolvedValueOnce({
      value: `
        <script>alert('xss')</script>
        <style>body { color: red; }</style>
        <p>Safe text</p>
        <a href="javascript:alert('xss')">Unsafe link</a>
        <a href="data:text/html;base64,SGFja2Vk">Unsafe data link</a>
        <img alt="Image description" src="data:image/png;base64,AAAA" />
      `,
      messages: [],
    })

    const result = await new LocalDocumentExtractor().extract({
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      body: Buffer.from('docx-binary'),
    })

    expect(result.markdown).toContain('Safe text')
    expect(result.markdown).toContain('Unsafe link')
    expect(result.markdown).toContain('Image description')
    expect(result.markdown).not.toContain('javascript:')
    expect(result.markdown).not.toContain('data:')
    expect(result.markdown).not.toContain('base64')
    expect(result.markdown).not.toContain('alert')
  })
})
