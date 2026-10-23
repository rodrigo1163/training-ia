import { randomUUID } from 'node:crypto';
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import {
  Organization,
  type OrganizationProps,
} from '../../src/domain/enterprise/entities/organization';

export function makeOrganization(
  override: Partial<OrganizationProps> = {},
  id?: UniqueEntityId,
) {
  const suffix = randomUUID();

  return Organization.create(
    {
      name: `Organization ${suffix}`,
      slug: `organization-${suffix}`,
      ...override,
    },
    id,
  );
}
