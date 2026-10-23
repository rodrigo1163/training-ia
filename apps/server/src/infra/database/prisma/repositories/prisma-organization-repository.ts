import { Injectable } from '@nestjs/common';
import type { OrganizationRepository } from '../../../../domain/application/repositories/organization-repository';
import type { Organization } from '../../../../domain/enterprise/entities/organization';
import { PrismaService } from '../prisma.service';
import { PrismaOrganizationMapper } from '../mappers/prisma-organization-mapper';

@Injectable()
export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findBySlug(slug: string): Promise<Organization | null> {
    const organization = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (!organization) {
      return null;
    }

    return PrismaOrganizationMapper.toDomain(organization);
  }
}
