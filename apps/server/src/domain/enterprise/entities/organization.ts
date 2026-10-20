import { Entity } from '@training-ia/core/entities/entity';
import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';
import type { Optional } from '@training-ia/core/types/optional';

export interface OrganizationProps {
  name: string;
  slug: string;
  logo: string | null;
  metadata: string | null;
  createdAt: Date;
}

export class Organization extends Entity<OrganizationProps> {
  get name() {
    return this.props.name;
  }

  get slug() {
    return this.props.slug;
  }

  get logo() {
    return this.props.logo;
  }

  get metadata() {
    return this.props.metadata;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  static create(
    props: Optional<OrganizationProps, 'logo' | 'metadata' | 'createdAt'>,
    id?: UniqueEntityId,
  ) {
    return new Organization(
      {
        ...props,
        logo: props.logo ?? null,
        metadata: props.metadata ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
