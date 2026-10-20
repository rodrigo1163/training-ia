import { PrismaPg } from '@prisma/adapter-pg'

export function createPostgresAdapter(databaseUrl: string): PrismaPg {
  const url = new URL(databaseUrl)
  const schema = url.searchParams.get('schema') ?? undefined

  return new PrismaPg({ connectionString: databaseUrl }, { schema })
}
