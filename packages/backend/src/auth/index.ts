import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db';
import { users, sessions, accounts, verifications } from '../db/schema';

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,

  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),

  emailAndPassword: {
    enabled: true,
  },

  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'client',
        input: true,
      },
    },
  },

  advanced: {
    cookies: {
      session_token: {
        attributes: {
          sameSite: 'lax',
          path: '/',
          httpOnly: true,
        },
      },
    },
  },

  trustedOrigins: [process.env.FRONTEND_URL || 'http://localhost:3000'],
});

export type Auth = typeof auth;
