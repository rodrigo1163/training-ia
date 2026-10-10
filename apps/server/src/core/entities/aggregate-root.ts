import { DomainEvent } from '../events/domain-event.js'
import { DomainEvents } from '../events/domain-events.js'
import { Entity } from './entity.js'

export abstract class AggregateRoot<Props> extends Entity<Props> {
	private _doaminEvents: DomainEvent[] = []

	get domainEvents(): DomainEvent[] {
		return this._doaminEvents
	}

	protected addDomainEvent(domainEvent: DomainEvent): void {
		this._doaminEvents.push(domainEvent)
		DomainEvents.markAggregateForDispatch(this)
	}

	public clearEvents(): void {
		this._doaminEvents = []
	}
}
