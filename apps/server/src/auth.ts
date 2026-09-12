import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { organization } from 'better-auth/plugins'

import { db } from './db/index.js'
import * as schema from './db/schema.js'
import { env } from './env.js'

export const auth = betterAuth({
  appName: 'training-ia',
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  plugins: [organization()],
  trustedOrigins: [env.CLIENT_ORIGIN],
})
