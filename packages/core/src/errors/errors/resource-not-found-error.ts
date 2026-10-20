import { type UseCaseError } from '../use-case-error.js'

export class ResourceNotFoundError extends Error implements UseCaseError {
	constructor() {
		super('Resource not found.')
	}
}
