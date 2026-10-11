import type { OrganizationReference } from '../../../../domain/application/repositories/organization-repository.js';
import type { Organization as PrismaOrganization } from '../../../../../prisma/generated/prisma/client.js';

export class PrismaOrganizationMapper {
  static toDomain(organization: PrismaOrganization): OrganizationReference {
    return {
      id: organization.id,
      slug: organization.slug,
    };
  }
}
