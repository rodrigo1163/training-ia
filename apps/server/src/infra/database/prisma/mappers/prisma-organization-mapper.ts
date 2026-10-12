import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { Organization } from '@/domain/enterprise/entities/organization';
import type { Organization as PrismaOrganization } from '../../../../../prisma/generated/prisma/client.js';
import type { Prisma } from '../../../../../prisma/generated/prisma/client.js';

export class PrismaOrganizationMapper {
  static toDomain(raw: PrismaOrganization): Organization {
    return Organization.create(
      {
        name: raw.name,
        slug: raw.slug,
        logo: raw.logo,
        metadata: raw.metadata,
        createdAt: raw.createdAt,
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPrisma(
    organization: Organization,
  ): Prisma.OrganizationUncheckedCreateInput {
    return {
      id: organization.id.toString(),
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
      metadata: organization.metadata,
      createdAt: organization.createdAt,
    };
  }
}
