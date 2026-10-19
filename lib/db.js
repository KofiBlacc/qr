import { neon } from "@neondatabase/serverless";
import { randomInt } from "crypto";

let ready;

// Returns a SQL function; creates the tables on first use.
export async function getDb() {
  const sql = neon(process.env.DATABASE_URL);
  if (!ready) {
    ready = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL)`;
      await sql`CREATE TABLE IF NOT EXISTS zones (
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
      await sql`ALTER TABLE codes ADD COLUMN IF NOT EXISTS secret TEXT`;
      await sql`UPDATE codes SET secret = upper(substr(md5(random()::text || id::text), 1, 8)) WHERE secret IS NULL`;
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS codes_secret_idx ON codes (secret)`;
      await sql`ALTER TABLE codes ADD COLUMN IF NOT EXISTS zone TEXT`;
      await sql`ALTER TABLE codes ADD COLUMN IF NOT EXISTS photo TEXT`;
    })().catch((e) => { ready = null; throw e; });
  }
  await ready;
  return sql;
}

export const isAdmin = (req) =>
  !!process.env.ADMIN_PASSWORD &&
  req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;

export const isUuid = (s) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s));

// 8 characters from an alphabet without look-alikes (no 0/O, 1/I/L)
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const makeSecret = () =>
  Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

// Forgiving input: ignores case, spaces and dashes; fixes common look-alikes
export const normSecret = (s) =>
  String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1");
