import { AggregateRoot } from '../entities/aggregate-root.js'
import { UniqueEntityId } from '../entities/unique-entity-id.js'
import { type DomainEvent } from './domain-event.js'

type DomainEventCallback = (event: unknown) => void | Promise<void>

export class DomainEvents {
	private static handlersMap: Record<string, DomainEventCallback[]> = {}
	private static markedAggregates: AggregateRoot<unknown>[] = []

	public static shouldRun = true

	public static markAggregateForDispatch(aggregate: AggregateRoot<unknown>) {
		const aggregateFound = !!DomainEvents.findMarkedAggregateByID(aggregate.id)

		if (!aggregateFound) {
			DomainEvents.markedAggregates.push(aggregate)
		}
	}

	private static async dispatchAggregateEvents(
		aggregate: AggregateRoot<unknown>,
	) {
		for (const event of aggregate.domainEvents) {
			await DomainEvents.dispatch(event)
		}
	}

	private static removeAggregateFromMarkedDispatchList(
		aggregate: AggregateRoot<unknown>,
	) {
		const index = DomainEvents.markedAggregates.findIndex((a) =>
			a.equals(aggregate),
		)

		DomainEvents.markedAggregates.splice(index, 1)
	}

	private static findMarkedAggregateByID(
		id: UniqueEntityId,
	): AggregateRoot<unknown> | undefined {
		return DomainEvents.markedAggregates.find((aggregate) =>
			aggregate.id.equals(id),
		)
	}

	public static async dispatchEventsForAggregate(id: UniqueEntityId) {
		const aggregate = DomainEvents.findMarkedAggregateByID(id)

		if (aggregate) {
			await DomainEvents.dispatchAggregateEvents(aggregate)
			aggregate.clearEvents()
			DomainEvents.removeAggregateFromMarkedDispatchList(aggregate)
		}
	}

	public static register(
		callback: DomainEventCallback,
		eventClassName: string,
	) {
		const wasEventRegisteredBefore = eventClassName in DomainEvents.handlersMap

		if (!wasEventRegisteredBefore) {
			DomainEvents.handlersMap[eventClassName] = []
		}

		DomainEvents.handlersMap[eventClassName].push(callback)
	}

	public static clearHandlers() {
		DomainEvents.handlersMap = {}
	}

	public static clearMarkedAggregates() {
		DomainEvents.markedAggregates = []
	}

	private static async dispatch(event: DomainEvent) {
		const eventClassName: string = event.constructor.name

		const isEventRegistered = eventClassName in DomainEvents.handlersMap

		if (!DomainEvents.shouldRun) {
			return
		}

		if (isEventRegistered) {
			const handlers = DomainEvents.handlersMap[eventClassName]

			for (const handler of handlers) {
				await handler(event)
			}
		}
	}
}
