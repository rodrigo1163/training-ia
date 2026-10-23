import { UseCaseError } from '@/core/errors/use-case-error';

export class WebsiteFetchError extends Error implements UseCaseError {
  constructor() {
    super('Could not fetch website');
  }
}
