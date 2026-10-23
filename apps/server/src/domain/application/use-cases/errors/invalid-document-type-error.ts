import { UseCaseError } from '@/core/errors/use-case-error';

export class InvalidDocumentTypeError extends Error implements UseCaseError {
  constructor() {
    super('Invalid document type');
  }
}
