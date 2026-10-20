import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';
import { Organization } from './organization.js';

describe('Organization', () => {
  it('creates an organization with nullable defaults', () => {
    const organization = Organization.create(
      {
        name: 'Acme',
        slug: 'acme',
      },
      new UniqueEntityId('organization-1'),
    );

    expect(organization.id.toString()).toBe('organization-1');
    expect(organization.name).toBe('Acme');
    expect(organization.slug).toBe('acme');
    expect(organization.logo).toBeNull();
    expect(organization.metadata).toBeNull();
    expect(organization.createdAt).toBeInstanceOf(Date);
  });
});
