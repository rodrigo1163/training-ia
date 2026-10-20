import { type UseCaseError } from '../use-case-error.js'

export class NotAllowedError extends Error implements UseCaseError {
	constructor() {
		super('Not allowed.')
	}
}
