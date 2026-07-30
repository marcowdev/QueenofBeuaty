import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

// Use the runtime bindings exposed on globalThis to avoid relying on a
// non-existent "cloudflare:workers" module in TypeScript imports.
const cfEnv = (globalThis as any).env;

export function getDb() {
  if (!cfEnv || !cfEnv.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(cfEnv.DB, { schema });
}
