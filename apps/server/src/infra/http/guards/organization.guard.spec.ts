import { InMemoryOrganizationMemberRepository } from '../../../../test/repositories/in-memory-organization-member-repository.js';
import { makeOrganizationMember } from '../../../../test/factories/make-organization-member.js';
import { UniqueEntityId } from '@training-ia/core/entities/unique-entity-id';
import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { OrganizationGuard, type OrganizationRequest } from './organization.guard.js';

function makeContext(request: OrganizationRequest): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('OrganizationGuard', () => {
  it('rejects a request without an authenticated session', async () => {
    const repository = new InMemoryOrganizationMemberRepository();
    const guard = new OrganizationGuard(repository);

    await expect(
      guard.canActivate(
        makeContext({ params: { orgSlug: 'organization-one' } } as OrganizationRequest),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a user who is not a member of the organization', async () => {
    const repository = new InMemoryOrganizationMemberRepository();
    const guard = new OrganizationGuard(repository);

    const request = {
      params: { orgSlug: 'organization-one' },
      session: { user: { id: 'user-2' } },
    } as OrganizationRequest;

    await expect(guard.canActivate(makeContext(request))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('attaches the authenticated organization member to the request', async () => {
    const repository = new InMemoryOrganizationMemberRepository();
    const organizationMember = makeOrganizationMember({
      orgId: new UniqueEntityId('organization-1'),
      userId: new UniqueEntityId('user-1'),
      role: 'owner',
    });
    repository.add(organizationMember, 'organization-one');
    const guard = new OrganizationGuard(repository);
    const request = {
      params: { orgSlug: 'organization-one' },
      session: { user: { id: 'user-1' } },
    } as OrganizationRequest;

    await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
    expect(request.organizationMember).toBe(organizationMember);
  });
});
