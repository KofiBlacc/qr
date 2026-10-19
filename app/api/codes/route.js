import QRCode from "qrcode";
import { getDb, isAdmin } from "../../../lib/db";

export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const dept = Number(new URL(req.url).searchParams.get("department")) || null;
  const sql = await getDb();
  const rows = dept
    ? await sql`SELECT c.id, c.label, c.created_at, c.scan_count, c.first_scanned_at, d.name AS department
        FROM codes c LEFT JOIN departments d ON d.id = c.department_id
        WHERE c.department_id = ${dept} ORDER BY c.created_at DESC LIMIT 200`
    : await sql`SELECT c.id, c.label, c.created_at, c.scan_count, c.first_scanned_at, d.name AS department
        FROM codes c LEFT JOIN departments d ON d.id = c.department_id
        ORDER BY c.created_at DESC LIMIT 200`;
  return Response.json(rows);
}

export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { label, departmentId } = await req.json();
  const clean = String(label || "").trim().slice(0, 200);
  if (!clean) return Response.json({ error: "Label required" }, { status: 400 });
  const sql = await getDb();
  const [row] = await sql`INSERT INTO codes (label, department_id)
    VALUES (${clean}, ${Number(departmentId) || null}) RETURNING id`;
  const url = `${new URL(req.url).origin}/verify?c=${row.id}`;
  const qr = await QRCode.toDataURL(url, { width: 400, margin: 2 });
  return Response.json({ id: row.id, url, qr });
}
