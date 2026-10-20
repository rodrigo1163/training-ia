import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';
import { OrganizationMember } from './organization-member.js';

describe('Organization member', () => {
  it('creates a member with its organization and user identities', () => {
    const member = OrganizationMember.create(
      {
        orgId: new UniqueEntityId('organization-1'),
        userId: new UniqueEntityId('user-1'),
        role: 'owner',
      },
      new UniqueEntityId('member-1'),
    );

    expect(member.id.toString()).toBe('member-1');
    expect(member.orgId.toString()).toBe('organization-1');
    expect(member.userId.toString()).toBe('user-1');
    expect(member.role).toBe('owner');
    expect(member.createdAt).toBeInstanceOf(Date);
  });
});
