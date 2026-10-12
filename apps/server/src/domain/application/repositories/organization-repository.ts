import type { Organization } from '../../enterprise/entities/organization.js';

export abstract class OrganizationRepository {
  abstract findBySlug(slug: string): Promise<Organization | null>;
}
