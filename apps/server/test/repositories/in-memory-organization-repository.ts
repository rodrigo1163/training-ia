import type { OrganizationRepository } from '../../src/domain/application/repositories/organization-repository';
import type { Organization } from '../../src/domain/enterprise/entities/organization';

export class InMemoryOrganizationRepository implements OrganizationRepository {
  public items: Organization[] = [];

  async findBySlug(slug: string): Promise<Organization | null> {
    return (
      this.items.find((organization) => organization.slug === slug) ?? null
    );
  }
}
