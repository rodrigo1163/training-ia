import { UseCaseError } from '@training-ia/core/errors/use-case-error.js';

export class WebsiteFetchError extends Error implements UseCaseError {
  constructor() {
    super('Could not fetch website');
  }
}
