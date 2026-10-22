import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LocalDocumentExtractor } from './local-document-extractor.js'

const { getDocument } = vi.hoisted(() => ({
  getDocument: vi.fn(),
}))

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument,
}))

describe('LocalDocumentExtractor', () => {
  beforeEach(() => {
    getDocument.mockReset()
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
})
