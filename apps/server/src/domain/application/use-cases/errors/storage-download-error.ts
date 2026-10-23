import type { UseCaseError } from '@/core/errors/use-case-error';

export class StorageDownloadError extends Error implements UseCaseError {
  constructor() {
    super('Unable to load the document file.');
  }
}
