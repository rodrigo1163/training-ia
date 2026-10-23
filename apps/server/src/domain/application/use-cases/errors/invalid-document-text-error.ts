import { UseCaseError } from '@/core/errors/use-case-error';

export class InvalidDocumentTextError extends Error implements UseCaseError {
  constructor() {
    super('Invalid document text');
  }
}
