import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

type TestAgent = ReturnType<typeof request.agent>;

interface AuthenticatedContextOverrides {
  email?: string;
  name?: string;
  organizationName?: string;
  orgSlug?: string;
  password?: string;
}

interface TestOrganizationOverrides extends Partial<
  Pick<TestOrganization, 'name' | 'slug'>
> {
  keepCurrentActiveOrganization?: boolean;
}

export interface TestOrganization {
  id: string;
  name: string;
  slug: string;
}

export interface AuthenticatedTestContext {
  agent: TestAgent;
  organization: TestOrganization;
  userId: string;
}

export async function createAuthenticatedTestContext(
  app: INestApplication,
  overrides: AuthenticatedContextOverrides = {},
): Promise<AuthenticatedTestContext> {
  const suffix = randomUUID();
  const agent = request.agent(app.getHttpServer());

  const signUpResponse = await agent
    .post('/api/auth/sign-up/email')
    .send({
      email: overrides.email ?? `e2e-${suffix}@example.com`,
      name: overrides.name ?? 'E2E User',
      password: overrides.password ?? 'e2e-password-123',
    })
    .expect(200);

  const organization = await createTestOrganization(agent, {
    keepCurrentActiveOrganization: false,
    name: overrides.organizationName ?? 'E2E Organization',
    slug: overrides.orgSlug ?? `e2e-organization-${suffix}`,
  });

  return {
    agent,
    organization,
    userId: signUpResponse.body.user.id as string,
  };
}

export async function createTestOrganization(
  agent: TestAgent,
  overrides: TestOrganizationOverrides = {},
): Promise<TestOrganization> {
  const suffix = randomUUID();
  const response = await agent
    .post('/api/auth/organization/create')
    .send({
      keepCurrentActiveOrganization:
        overrides.keepCurrentActiveOrganization ?? true,
      name: overrides.name ?? `E2E Organization ${suffix}`,
      slug: overrides.slug ?? `e2e-organization-${suffix}`,
    })
    .expect(200);

  return {
    id: response.body.id as string,
    name: response.body.name as string,
    slug: response.body.slug as string,
  };
}
