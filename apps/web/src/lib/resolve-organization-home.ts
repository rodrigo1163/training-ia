import { authClient } from '@/lib/auth-client'

type AuthSession = typeof authClient.$Infer.Session

type OrganizationHomeRedirect =
  | { to: '/create-organization' }
  | { to: '/org/$orgSlug/dashboard'; params: { orgSlug: string } }

export async function resolveOrganizationHome(
  session: AuthSession,
): Promise<OrganizationHomeRedirect> {
  const { data: organizations, error } = await authClient.organization.list()

  if (error) {
    throw new Error(
      error.message ?? 'Unable to load organizations.',
    )
  }

  if (!organizations || organizations.length === 0) {
    return { to: '/create-organization' }
  }

  const activeOrganizationId =
    session.session.activeOrganizationId ?? null

  const activeOrganization =
    organizations.find(
      (organization) => organization.id === activeOrganizationId,
    ) ?? organizations[0]

  if (activeOrganizationId !== activeOrganization.id) {
    const setActiveResult = await authClient.organization.setActive({
      organizationId: activeOrganization.id,
    })

    if (setActiveResult.error) {
      throw new Error(
        setActiveResult.error.message ??
          'Unable to activate the organization.',
      )
    }
  }

  return {
    to: '/org/$orgSlug/dashboard',
    params: { orgSlug: activeOrganization.slug },
  }
}
