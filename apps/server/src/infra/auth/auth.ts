import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { organization } from 'better-auth/plugins'
import type { PrismaService } from '@/infra/database/prisma/prisma.service'
import type { Env } from '@/infra/env/env'

type AuthEnv = Pick<Env, 'BETTER_AUTH_URL' | 'BETTER_AUTH_SECRET' | 'CLIENT_ORIGIN'>

export function createAuth(prisma: PrismaService, env: AuthEnv) {
  return betterAuth({
    appName: 'training-ia',
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    trustedOrigins: [env.CLIENT_ORIGIN],
    plugins: [organization()],
  })
}
