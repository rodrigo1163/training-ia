import type { OrganizationMemberRepository } from '../../src/domain/application/repositories/organization-member-repository';
import type { OrganizationMember } from '../../src/domain/enterprise/entities/organization-member';

export class InMemoryOrganizationMemberRepository implements OrganizationMemberRepository {
  public items: OrganizationMember[] = [];
  public orgSlugs = new Map<string, string>();

  add(member: OrganizationMember, orgSlug: string) {
    this.items.push(member);
    this.orgSlugs.set(
      member.orgId.toString(),
      orgSlug,
    );
  }

  async findByOrgSlugAndUserId(
    orgSlug: string,
    userId: string,
  ): Promise<OrganizationMember | null> {
    return (
      this.items.find(
        (member) =>
          member.userId.toString() === userId &&
          this.orgSlugs.get(member.orgId.toString()) === orgSlug,
      ) ?? null
    );
  }
}
