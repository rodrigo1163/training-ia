import { UseCaseError } from '@training-ia/core/errors/use-case-error.js';

export class InvalidDocumentTextError extends Error implements UseCaseError {
  constructor() {
    super('Invalid document text');
  }
}
