import { Entity } from '@/core/entities/entity';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import type { Optional } from '@/core/types/optional';
import { BotSlug } from '../value-objects/bot-slug.js';

export interface BotProps {
  organizationId: UniqueEntityId;
  name: string;
  slug: BotSlug;
  documentCount: number;
  createdAt: Date;
  updatedAt: Date | null;
}

export class Bot extends Entity<BotProps> {
  get organizationId() {
    return this.props.organizationId;
  }

  get name() {
    return this.props.name;
  }

  get slug() {
    return this.props.slug;
  }

  get documentCount() {
    return this.props.documentCount;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  static create(
    props: Optional<
      BotProps,
      'slug' | 'documentCount' | 'createdAt' | 'updatedAt'
    >,
    id?: UniqueEntityId,
  ) {
    return new Bot(
      {
        ...props,
        slug: props.slug ?? BotSlug.create(props.name),
        documentCount: props.documentCount ?? 0,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
      },
      id,
    );
  }
}
