import type { UseCaseError } from '@/core/errors/use-case-error';

export class BotAlreadyExistsError extends Error implements UseCaseError {
  constructor() {
    super('A bot with this name already exists.');
  }
}
