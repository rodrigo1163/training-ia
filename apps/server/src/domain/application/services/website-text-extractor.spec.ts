import { describe, expect, it } from 'vitest';
import { CheerioWebsiteTextExtractor } from '../../../infra/services/cheerio-website-text-extractor.js';

describe('CheerioWebsiteTextExtractor', () => {
  it('extracts readable text and removes non-content elements', () => {
    const result = new CheerioWebsiteTextExtractor().extract(`
      <html>
        <head><style>hidden style</style></head>
        <body>
          <nav>Menu repetido</nav>
          <script>not visible content</script>
          <main>
            <h1>Training IA</h1>
            <p>Conteúdo útil do site.</p>
            <h2>Recursos</h2>
            <ul><li>Primeiro recurso</li><li>Segundo recurso</li></ul>
            <noscript>fallback content</noscript>
            <svg><text>icon label</text></svg>
          </main>
          <footer>Rodapé repetido</footer>
        </body>
      </html>
    `);

    expect(result).toBe(
      [
        'Training IA',
        '',
        'Conteúdo útil do site.',
        '',
        'Recursos',
        '',
        '- Primeiro recurso',
        '- Segundo recurso',
      ].join('\n'),
    );
  });

  it('returns an empty string when the page has no readable text', () => {
    expect(
      new CheerioWebsiteTextExtractor().extract(
        '<html><body><script>code</script></body></html>',
      ),
    ).toBe('');
  });
});
