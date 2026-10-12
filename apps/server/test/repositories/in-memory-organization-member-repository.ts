import type { OrganizationMemberRepository } from '../../src/domain/application/repositories/organization-member-repository.js';
import type { OrganizationMember } from '../../src/domain/enterprise/entities/organization-member.js';

export class InMemoryOrganizationMemberRepository implements OrganizationMemberRepository {
  public items: OrganizationMember[] = [];
  public organizationSlugs = new Map<string, string>();

  add(member: OrganizationMember, organizationSlug: string) {
    this.items.push(member);
    this.organizationSlugs.set(
      member.organizationId.toString(),
      organizationSlug,
    );
  }

  async findByOrgSlug(
    organizationSlug: string,
    userId: string,
  ): Promise<OrganizationMember | null> {
    return (
      this.items.find(
        (member) =>
          member.userId.toString() === userId &&
          this.organizationSlugs.get(member.organizationId.toString()) ===
            organizationSlug,
      ) ?? null
    );
  }
}
