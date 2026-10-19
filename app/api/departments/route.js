import { getDb, isAdmin } from "../../../lib/db";

export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const sql = await getDb();
  return Response.json(await sql`SELECT id, name FROM departments ORDER BY name`);
}

export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { name } = await req.json();
  const clean = String(name || "").trim().slice(0, 100);
  if (!clean) return Response.json({ error: "Name required" }, { status: 400 });
  const sql = await getDb();
  await sql`INSERT INTO departments (name) VALUES (${clean}) ON CONFLICT DO NOTHING`;
  return Response.json({ ok: true });
}

export async function DELETE(req) {
  if (!isAdmin(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await req.json()).id);
  if (!id) return Response.json({ error: "Invalid department" }, { status: 400 });
  const sql = await getDb();
  await sql`UPDATE codes SET department_id = NULL WHERE department_id = ${id}`;
  await sql`DELETE FROM departments WHERE id = ${id}`;
  return Response.json({ ok: true });
}
