import type { UseCaseError } from '@training-ia/core/errors/use-case-error.js';

export class BotAlreadyExistsError extends Error implements UseCaseError {
  constructor() {
    super('A bot with this name already exists.');
  }
}
