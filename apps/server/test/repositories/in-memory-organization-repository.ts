import type { OrganizationRepository } from '../../src/domain/application/repositories/organization-repository.js';
import type { Organization } from '../../src/domain/enterprise/entities/organization.js';

export class InMemoryOrganizationRepository implements OrganizationRepository {
  public items: Organization[] = [];

  async findBySlug(slug: string): Promise<Organization | null> {
    return (
      this.items.find((organization) => organization.slug === slug) ?? null
    );
  }
}
