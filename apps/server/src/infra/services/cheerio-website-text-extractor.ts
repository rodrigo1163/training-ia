import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { WebsiteTextExtractor } from '@/domain/application/services/website-text-extractor';

type HtmlNode = {
  type: string;
  data?: string;
  name?: string;
  children?: HtmlNode[];
};

const BLOCK_TAGS = new Set([
  'address',
  'article',
  'blockquote',
  'div',
  'dl',
  'dt',
  'dd',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'main',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'table',
  'ul',
]);

function renderNode(node: HtmlNode): string {
  if (node.type === 'text') {
    return (node.data ?? '').replace(/\s+/g, ' ');
  }

  const tag = node.name?.toLowerCase();
  const content = (node.children ?? []).map(renderNode).join('');

  if (!content.trim() && tag !== 'br') {
    return '';
  }

  if (tag === 'br') {
    return '\n';
  }

  if (tag === 'li') {
    return `\n- ${content.trim()}`;
  }

  if (tag && BLOCK_TAGS.has(tag)) {
    return `\n\n${content.trim()}\n\n`;
  }

  return content;
}

function normalizeExtractedText(text: string): string {
  return text
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

@Injectable()
export class CheerioWebsiteTextExtractor extends WebsiteTextExtractor {
  extract(html: string): string {
    const $ = cheerio.load(html);
    $(
      'script, style, noscript, svg, template, iframe, canvas, nav, footer, aside, form, [hidden], [aria-hidden="true"]',
    ).remove();

    const contentNode =
      ['main', 'article', 'body']
        .map((selector) =>
          $(selector)
            .filter((_, element) => $(element).text().trim().length > 0)
            .first()
            .get(0),
        )
        .find((node) => node !== undefined) ?? $.root().get(0);

    if (!contentNode) {
      return '';
    }

    return normalizeExtractedText(renderNode(contentNode as unknown as HtmlNode));
  }
}
