import { UseCaseError } from '../../../../core/errors/use-case-error.js';

export class InvalidDocumentTypeError extends Error implements UseCaseError {
  constructor() {
    super('Invalid document type');
  }
}
