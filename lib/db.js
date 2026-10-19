import { neon } from "@neondatabase/serverless";

let ready;

// Returns a SQL function; creates the tables on first use.
export async function getDb() {
  const sql = neon(process.env.DATABASE_URL);
  if (!ready) {
    ready = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL)`;
      await sql`CREATE TABLE IF NOT EXISTS codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        label TEXT NOT NULL,
        department_id INT REFERENCES departments(id),
        created_at TIMESTAMPTZ DEFAULT now(),
        scan_count INT DEFAULT 0,
        first_scanned_at TIMESTAMPTZ,
        last_scanned_at TIMESTAMPTZ)`;
    })().catch((e) => { ready = null; throw e; });
  }
  await ready;
  return sql;
}

export const isAdmin = (req) =>
  !!process.env.ADMIN_PASSWORD?.trim() &&
  req.headers.get("x-admin-password")?.trim() === process.env.ADMIN_PASSWORD.trim();

export const isUuid = (s) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s));
