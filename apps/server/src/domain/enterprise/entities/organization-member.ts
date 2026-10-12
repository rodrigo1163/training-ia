import { Entity } from '@/core/entities/entity';
import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import type { Optional } from '@/core/types/optional';

export interface OrganizationMemberProps {
  orgId: UniqueEntityId;
  userId: UniqueEntityId;
  role: string;
  createdAt: Date;
}

export class OrganizationMember extends Entity<OrganizationMemberProps> {
  get orgId() {
    return this.props.orgId;
  }

  get userId() {
    return this.props.userId;
  }

  get role() {
    return this.props.role;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  static create(
    props: Optional<OrganizationMemberProps, 'createdAt'>,
    id?: UniqueEntityId,
  ) {
    return new OrganizationMember(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
