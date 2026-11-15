import type { Organization } from '../../enterprise/entities/organization';

export abstract class OrganizationRepository {
  abstract findBySlug(slug: string): Promise<Organization | null>;

  abstract update(organization: Organization): Promise<void>;
}
