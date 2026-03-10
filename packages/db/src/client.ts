import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL ?? "", {
  prepare: false, // REQUIRED — pgbouncer does not support prepared statements
  max: 1, // REQUIRED — limit connections per serverless function instance
});

export const db = drizzle(client, { schema });
