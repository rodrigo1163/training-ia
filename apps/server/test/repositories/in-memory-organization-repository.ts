import type { OrganizationRepository } from '../../src/domain/application/repositories/organization-repository';
import type { Organization } from '../../src/domain/enterprise/entities/organization';

export class InMemoryOrganizationRepository implements OrganizationRepository {
  public items: Organization[] = [];

  async findBySlug(slug: string): Promise<Organization | null> {
    return (
      this.items.find((organization) => organization.slug === slug) ?? null
    );
  }

  async update(organization: Organization): Promise<void> {
    const index = this.items.findIndex((item) =>
      item.id.equals(organization.id),
    );
    if (index >= 0) this.items[index] = organization;
  }
}
