import type { UseCaseError } from '@training-ia/core/errors/use-case-error.js';

export class StorageDownloadError extends Error implements UseCaseError {
  constructor() {
    super('Unable to load the document file.');
  }
}
