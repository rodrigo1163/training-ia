import type { OrganizationMemberRepository } from '@/domain/application/repositories/organization-member-repository';
import type { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import { Injectable } from '@nestjs/common';
import { PrismaOrganizationMemberMapper } from '../mappers/prisma-organization-member-mapper.js';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class PrismaOrganizationMemberRepository implements OrganizationMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByOrgSlugAndUserId(
    orgSlug: string,
    userId: string,
  ): Promise<OrganizationMember | null> {
    const member = await this.prisma.member.findFirst({
      where: {
        userId,
        organization: {
          slug: orgSlug,
        },
      },
    });

    if (!member) {
      return null;
    }

    return PrismaOrganizationMemberMapper.toDomain(member);
  }
}
