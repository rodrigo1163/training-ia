import { Injectable } from '@nestjs/common';
import type {
  OrganizationReference,
  OrganizationRepository,
} from '../../../../domain/application/repositories/organization-repository.js';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string): Promise<OrganizationReference | null> {
    return this.prisma.organization.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
      },
    });
  }
}
