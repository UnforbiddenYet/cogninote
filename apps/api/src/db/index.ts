import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create postgres connection
const client = postgres(databaseUrl, {
  max: 20,
});

// Create drizzle instance with schema
export const db = drizzle(client, { schema });

// Export for migrations
export { client };
