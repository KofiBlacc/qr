import { getDb, isAdmin } from "../../../lib/db";

export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const sql = await getDb();
  return Response.json(await sql`SELECT id, name FROM zones ORDER BY name`);
}

export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { name } = await req.json();
  const clean = String(name || "").trim().slice(0, 100);
  if (!clean) return Response.json({ error: "Name required" }, { status: 400 });
  const sql = await getDb();
  await sql`INSERT INTO zones (name) VALUES (${clean}) ON CONFLICT DO NOTHING`;
  return Response.json({ ok: true });
}

export async function DELETE(req) {
  if (!isAdmin(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await req.json()).id);
  if (!id) return Response.json({ error: "Invalid zone" }, { status: 400 });
  const sql = await getDb();
  await sql`DELETE FROM zones WHERE id = ${id}`;
  return Response.json({ ok: true });
}
