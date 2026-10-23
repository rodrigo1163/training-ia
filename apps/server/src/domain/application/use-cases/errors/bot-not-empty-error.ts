import type { UseCaseError } from '@/core/errors/use-case-error';

export class BotNotEmptyError extends Error implements UseCaseError {
  constructor() {
    super('The bot must be empty before it can be deleted.');
  }
}
