import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LocalDocumentExtractor } from './local-document-extractor.js'

const { getDocument, toMarkdown } = vi.hoisted(() => ({
  getDocument: vi.fn(),
  toMarkdown: vi.fn(),
}))

vi.mock('@mdgate/pdf', () => ({
  toMarkdown,
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
    toMarkdown.mockReset()
  })

  it('extracts TXT content as Markdown without using a PDF or AI extractor', async () => {
    const result = await new LocalDocumentExtractor().extract({
      contentType: 'text/plain',
      body: Buffer.from('# Title\n\nDocument text.', 'utf8'),
    })

    expect(result.markdown).toBe('# Title\n\nDocument text.')
    expect(toMarkdown).not.toHaveBeenCalled()
  })

  it('converts HTML content to Markdown without using a PDF or AI extractor', async () => {
    const result = await new LocalDocumentExtractor().extract({
      contentType: 'text/html',
      body: Buffer.from('<h1>Title</h1><p>Document text.</p>', 'utf8'),
    })

    expect(result.markdown).toBe('# Title\n\nDocument text.')
    expect(toMarkdown).not.toHaveBeenCalled()
  })

  it('extracts PDF text in page order and normalizes it as Markdown', async () => {
    const body = Buffer.from('%PDF-test-content', 'utf8')
    toMarkdown.mockResolvedValue('First page\n\nSecond page')

    const result = await new LocalDocumentExtractor().extract({
      contentType: 'application/pdf',
      body,
    })

    expect(result.markdown).toBe('First page\n\nSecond page')
    expect(toMarkdown).toHaveBeenCalledWith(new Uint8Array(body))
  })

  it('converts bullet tables produced by the PDF extractor into Markdown lists', async () => {
    const body = Buffer.from('%PDF-list-content', 'utf8')
    toMarkdown.mockResolvedValue(
      [
        '**2. Nosso produto** O sistema oferece:',
        '|•|Controle de estoque em tempo real.|',
        '|---|---|',
        '|•|Cadastro de clientes e fornecedores.|',
        '|•|Gestão financeira com contas a pagar e receber.|',
        '',
        'Uma tabela real permanece intacta:',
        '|Plano|Preço|',
        '|---|---|',
        '|Básico|R$ 49,90|',
      ].join('\n'),
    )

    const result = await new LocalDocumentExtractor().extract({
      contentType: 'application/pdf',
      body,
    })

    expect(result.markdown).toBe(
      [
        '**2. Nosso produto**',
        '',
        'O sistema oferece:',
        '- Controle de estoque em tempo real.',
        '- Cadastro de clientes e fornecedores.',
        '- Gestão financeira com contas a pagar e receber.',
        '',
        'Uma tabela real permanece intacta:',
        '|Plano|Preço|',
        '|---|---|',
        '|Básico|R$ 49,90|',
      ].join('\n'),
    )
  })

  it('separates PDF section and question paragraphs', async () => {
    toMarkdown.mockResolvedValue(
      '**7. Próxima seção** A primeira linha continua na linha seguinte.',
    )
    const getTextContent = vi.fn().mockResolvedValue({
      items: [
        { str: '7. Próxima seção', hasEOL: false },
        { str: '', hasEOL: true },
        { str: 'A primeira linha', hasEOL: true },
        { str: 'continua na linha seguinte.', hasEOL: false },
      ],
    })
    getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({ getTextContent }),
      }),
      destroy: vi.fn().mockResolvedValue(undefined),
    })

    const result = await new LocalDocumentExtractor().extract({
      contentType: 'application/pdf',
      body: Buffer.from('%PDF-paragraphs', 'utf8'),
    })

    expect(result.markdown).toBe(
      ['**7. Próxima seção**', '', 'A primeira linha', 'continua na linha seguinte.'].join(
        '\n',
      ),
    )
  })

  it('rejects a PDF without extractable text', async () => {
    toMarkdown.mockResolvedValue('')

    await expect(
      new LocalDocumentExtractor().extract({
        contentType: 'application/pdf',
        body: Buffer.from('%PDF-empty', 'utf8'),
      }),
    ).rejects.toThrow('Document extraction produced no text')
  })

  it('rejects unsupported document types', async () => {
    await expect(
      new LocalDocumentExtractor().extract({
        contentType: 'application/octet-stream',
        body: Buffer.from('content'),
      }),
    ).rejects.toThrow('Unsupported document content type')

    expect(toMarkdown).not.toHaveBeenCalled()
  })
})
