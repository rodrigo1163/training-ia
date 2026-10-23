import { Slug } from './slug';

describe('Bot slug', () => {
  it('normalizes case, accents and separators', () => {
    expect(Slug.create('  Suporte Ágil / Vendas  ').value).toBe(
      'suporte-agil-vendas',
    );
  });

  it('uses a stable fallback when the name has no ASCII characters', () => {
    expect(Slug.create('客服').value).toBe('bot');
  });
});
