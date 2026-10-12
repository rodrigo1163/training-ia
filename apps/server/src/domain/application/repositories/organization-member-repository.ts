import type { OrganizationMember } from '../../enterprise/entities/organization-member.js';

export abstract class OrganizationMemberRepository {
  abstract findByOrgSlug(
    organizationSlug: string,
    userId: string,
  ): Promise<OrganizationMember | null>;
}
