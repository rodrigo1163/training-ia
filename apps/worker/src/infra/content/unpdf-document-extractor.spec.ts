import { describe, expect, it } from 'vitest'

import { UnpdfDocumentExtractor } from './unpdf-document-extractor.js'

const extractor = new UnpdfDocumentExtractor()

describe('Document extraction', () => {
  it('extracts TXT content in the worker', async () => {
    const result = await extractor.extract({
      contentType: 'text/plain',
      body: Buffer.from('# Title\n\nDocument text.', 'utf8'),
    })

    expect(result.text).toBe('Title\n\nDocument text.')
    expect(result.content.content?.[0]?.type).toBe('heading')
  })

  it('converts HTML content to formatted Tiptap JSON', async () => {
    const result = await extractor.extract({
      contentType: 'text/html',
      body: Buffer.from('<h1>Title</h1><p>Document text.</p>', 'utf8'),
    })

    expect(result.text).toBe('Title\n\nDocument text.')
    expect(result.content).toEqual({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Title' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Document text.' }],
        },
      ],
    })
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
