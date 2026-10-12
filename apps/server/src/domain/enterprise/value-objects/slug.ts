import { ValueObject } from '../../../core/entities/value-object.js';

interface SlugProps {
  value: string;
}

export class Slug extends ValueObject<SlugProps> {
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

    return new Slug({ value: slug || 'bot' });
  }
}
