import { UniqueEntityId } from '@/core/entities/unique-entity-id';
import { OrganizationMember } from '@/domain/enterprise/entities/organization-member';
import type {
  Member as PrismaMember,
  Prisma,
} from '@training-ia/database/client';

export class PrismaOrganizationMemberMapper {
  static toDomain(raw: PrismaMember): OrganizationMember {
    return OrganizationMember.create(
      {
        orgId: new UniqueEntityId(raw.organizationId),
        userId: new UniqueEntityId(raw.userId),
        role: raw.role,
        createdAt: raw.createdAt,
      },
      new UniqueEntityId(raw.id),
    );
  }

  static toPrisma(
    member: OrganizationMember,
  ): Prisma.MemberUncheckedCreateInput {
    return {
      id: member.id.toString(),
      organizationId: member.orgId.toString(),
      userId: member.userId.toString(),
      role: member.role,
      createdAt: member.createdAt,
    };
  }
}
