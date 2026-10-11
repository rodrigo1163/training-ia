import { Injectable } from '@nestjs/common';
import type {
  OrganizationReference,
  OrganizationRepository,
} from '../../../../domain/application/repositories/organization-repository.js';
import { PrismaService } from '../prisma.service.js';
import { PrismaOrganizationMapper } from '../mappers/prisma-organization-mapper.js';

@Injectable()
export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string): Promise<OrganizationReference | null> {
    const organization = await this.prisma.organization.findUnique({
      where: { slug },
    });

    return organization ? PrismaOrganizationMapper.toDomain(organization) : null;
  }
}
