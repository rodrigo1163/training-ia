import type { OrganizationMember } from '../../enterprise/entities/organization-member';

export abstract class OrganizationMemberRepository {
  abstract findByOrgSlugAndUserId(
    orgSlug: string,
    userId: string,
  ): Promise<OrganizationMember | null>;
}
