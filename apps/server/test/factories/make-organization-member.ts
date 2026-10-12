import { UniqueEntityId } from '../../src/core/entities/unique-entity-id.js';
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
      organizationId: new UniqueEntityId(),
      userId: new UniqueEntityId(),
      role: 'member',
      ...override,
    },
    id,
  );
}
