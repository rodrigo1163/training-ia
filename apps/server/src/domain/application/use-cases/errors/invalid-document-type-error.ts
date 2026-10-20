import { UseCaseError } from '@training-ia/core/errors/use-case-error.js';

export class InvalidDocumentTypeError extends Error implements UseCaseError {
  constructor() {
    super('Invalid document type');
  }
}
