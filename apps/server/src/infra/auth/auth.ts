import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { organization } from 'better-auth/plugins';

import { env } from '../../env.js';
import { prisma } from './db/prisma.js';

export const auth = betterAuth({
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
});
