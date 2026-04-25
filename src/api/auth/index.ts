import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { D1Database } from "@cloudflare/workers-types";
import { db } from "../database";
import * as schema from "../database/schema";
import type { Env } from "../env";

export function createAuth(env: Env) {
  const d = db(env.DB);
  return betterAuth({
    database: drizzleAdapter(d, {
      provider: "sqlite",
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    emailAndPassword: { enabled: true },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: env.BETTER_AUTH_URL ? [env.BETTER_AUTH_URL] : undefined,
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type _D1 = D1Database;
