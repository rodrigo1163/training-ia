import type {
  OrganizationMemberReference,
  OrganizationMemberRepository,
} from '../../src/domain/application/repositories/organization-member-repository.js';

export class InMemoryOrganizationMemberRepository implements OrganizationMemberRepository {
  public items: OrganizationMemberReference[] = [];

  async findByOrgSlug(
    organizationSlug: string,
    userId: string,
  ): Promise<OrganizationMemberReference | null> {
    return (
      this.items.find(
        (member) =>
          member.organizationSlug === organizationSlug &&
          member.userId === userId,
      ) ?? null
    );
  }
}
