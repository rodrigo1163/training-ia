import type {
  OrganizationMemberReference,
  OrganizationMemberRepository,
} from '@/domain/application/repositories/organization-member-repository';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class PrismaOrganizationMemberRepository implements OrganizationMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByOrgSlug(
    organizationSlug: string,
    userId: string,
  ): Promise<OrganizationMemberReference | null> {
    const member = await this.prisma.member.findFirst({
      where: {
        userId,
        organization: {
          slug: organizationSlug,
        },
      },
      select: {
        role: true,
        userId: true,
        organization: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
    });

    if (!member) return null;

    return {
      organizationId: member.organization.id,
      organizationSlug: member.organization.slug,
      userId: member.userId,
      role: member.role,
    };
  }
}
