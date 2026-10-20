import { UseCaseError } from '@training-ia/core/errors/use-case-error.js';

export class InvalidDocumentSizeError extends Error implements UseCaseError {
  constructor() {
    super('Invalid document size');
  }
}
