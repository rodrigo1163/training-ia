export abstract class WebsiteTextExtractor {
  abstract extract(html: string): string;
}
