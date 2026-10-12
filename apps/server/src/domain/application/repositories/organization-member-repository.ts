export interface OrganizationMemberReference {
  organizationId: string;
  organizationSlug: string;
  userId: string;
  role: string;
}

export abstract class OrganizationMemberRepository {
  abstract findByOrgSlug(
    organizationSlug: string,
    userId: string,
  ): Promise<OrganizationMemberReference | null>;
}
