import { UseCaseError } from '@/core/errors/use-case-error';

export class InvalidDocumentSizeError extends Error implements UseCaseError {
  constructor() {
    super('Invalid document size');
  }
}
