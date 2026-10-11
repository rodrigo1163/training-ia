export interface OrganizationReference {
  id: string;
  slug: string;
}

export abstract class OrganizationRepository {
  abstract findBySlug(slug: string): Promise<OrganizationReference | null>;
}
