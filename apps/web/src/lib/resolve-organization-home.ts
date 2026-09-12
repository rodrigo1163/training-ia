import { authClient } from '@/lib/auth-client'

type OrganizationHomeRedirect =
  | { to: '/create-organization' }
  | { to: '/org/$orgSlug/dashboard'; params: { orgSlug: string } }

export async function resolveOrganizationHome(): Promise<OrganizationHomeRedirect> {
  const { data: organizations, error } = await authClient.organization.list()

  if (error) {
    throw new Error(
      error.message ?? 'Não foi possível carregar as organizações.',
    )
  }

  if (!organizations || organizations.length === 0) {
    return { to: '/create-organization' }
  }

  const { data: session } = await authClient.getSession()
  const activeOrganizationId = session?.session.activeOrganizationId ?? null

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
          'Não foi possível ativar a organização.',
      )
    }
  }

  return {
    to: '/org/$orgSlug/dashboard',
    params: { orgSlug: activeOrganization.slug },
  }
}
