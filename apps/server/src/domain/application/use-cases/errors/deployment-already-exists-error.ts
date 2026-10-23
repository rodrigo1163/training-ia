import type { UseCaseError } from '@/core/errors/use-case-error';

export class DeploymentAlreadyExistsError extends Error implements UseCaseError {
  constructor() {
    super('The bot is already published.');
  }
}
