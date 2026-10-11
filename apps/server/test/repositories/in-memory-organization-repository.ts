import type {
  OrganizationReference,
  OrganizationRepository,
} from '../../src/domain/application/repositories/organization-repository.js';

export class InMemoryOrganizationRepository implements OrganizationRepository {
  public items: OrganizationReference[] = [];

  async findBySlug(slug: string): Promise<OrganizationReference | null> {
    return (
      this.items.find((organization) => organization.slug === slug) ?? null
    );
  }
}
