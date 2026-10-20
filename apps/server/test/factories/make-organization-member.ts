import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id'
import {
  OrganizationMember,
  type OrganizationMemberProps,
} from '../../src/domain/enterprise/entities/organization-member.js';

export function makeOrganizationMember(
  override: Partial<OrganizationMemberProps> = {},
  id?: UniqueEntityId,
) {
  return OrganizationMember.create(
    {
      orgId: new UniqueEntityId(),
      userId: new UniqueEntityId(),
      role: 'member',
      ...override,
    },
    id,
  );
}
