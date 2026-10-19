import {
  htmlToTiptap,
  textToTiptap,
  tiptapToPlainText,
} from './tiptap-content.js'

describe('Tiptap document conversion', () => {
  it('converts plain text paragraphs and headings to Tiptap JSON', () => {
    const document = textToTiptap('# Title\n\nFirst paragraph.\nSecond line.')

    expect(document).toEqual({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Title' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'First paragraph.\nSecond line.' }],
        },
      ],
    })
  })

  it('converts HTML using the server-side Tiptap schema', () => {
    const document = htmlToTiptap(
      '<h2>Title</h2><p>Hello <strong>world</strong>.</p><ul><li><p>One</p></li></ul>',
    )

    expect(document).toEqual({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Title' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Hello ' },
            { type: 'text', marks: [{ type: 'bold' }], text: 'world' },
            { type: 'text', text: '.' },
          ],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'One' }],
                },
              ],
            },
          ],
        },
      ],
    })
  })

  it('derives plain text while preserving block boundaries', () => {
    const text = tiptapToPlainText({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Title' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Paragraph' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Item' }],
                },
              ],
            },
          ],
        },
      ],
    })

    expect(text).toBe('Title\n\nParagraph\n\nItem')
  })
})
