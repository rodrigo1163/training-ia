import { ValueObject } from '../../../core/entities/value-object.js';

interface BotSlugProps {
  value: string;
}

export class BotSlug extends ValueObject<BotSlugProps> {
  get value() {
    return this.props.value;
  }

  static create(name: string) {
    const slug = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return new BotSlug({ value: slug || 'bot' });
  }
}
