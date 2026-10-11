import { BotSlug } from './bot-slug.js';

describe('Bot slug', () => {
  it('normalizes case, accents and separators', () => {
    expect(BotSlug.create('  Suporte Ágil / Vendas  ').value).toBe(
      'suporte-agil-vendas',
    );
  });

  it('uses a stable fallback when the name has no ASCII characters', () => {
    expect(BotSlug.create('客服').value).toBe('bot');
  });
});
