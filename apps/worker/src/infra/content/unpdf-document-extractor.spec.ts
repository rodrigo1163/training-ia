import { describe, expect, it } from 'vitest'

import { UnpdfDocumentExtractor } from './unpdf-document-extractor.js'

const extractor = new UnpdfDocumentExtractor()

describe('Document extraction', () => {
  it('extracts TXT content as Markdown', async () => {
    const result = await extractor.extract({
      contentType: 'text/plain',
      body: Buffer.from('# Title\n\nDocument text.', 'utf8'),
    })

    expect(result.markdown).toBe('# Title\n\nDocument text.')
  })

  it('converts HTML content to Markdown', async () => {
    const result = await extractor.extract({
      contentType: 'text/html',
      body: Buffer.from('<h1>Title</h1><p>Document text.</p>', 'utf8'),
    })

    expect(result.markdown).toBe('# Title\n\nDocument text.')
  })

  it('normalizes null bytes, line endings and excessive blank lines', async () => {
    const result = await extractor.extract({
      contentType: 'text/plain',
      body: Buffer.from('\u0000First\r\n\r\n\r\nSecond  ', 'utf8'),
    })

    expect(result.markdown).toBe('First\n\nSecond')
  })

  it('rejects unsupported document types', async () => {
    await expect(
      extractor.extract({
        contentType: 'application/octet-stream',
        body: Buffer.from('content'),
      }),
    ).rejects.toThrow('Unsupported document content type')
  })
})
