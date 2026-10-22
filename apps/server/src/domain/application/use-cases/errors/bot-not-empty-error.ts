import type { UseCaseError } from '@training-ia/core/errors/use-case-error.js';

export class BotNotEmptyError extends Error implements UseCaseError {
  constructor() {
    super('The bot must be empty before it can be deleted.');
  }
}
