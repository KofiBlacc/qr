import QRCode from "qrcode";
import { getDb, isAdmin } from "../../../lib/db";

export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const dept = Number(new URL(req.url).searchParams.get("department")) || null;
  const sql = await getDb();
  const rows = dept
    ? await sql`SELECT c.id, c.label, c.created_at, c.scan_count, c.first_scanned_at, d.name AS department
        FROM codes c LEFT JOIN departments d ON d.id = c.department_id
        WHERE c.department_id = ${dept} ORDER BY c.created_at DESC, c.label LIMIT 500`
    : await sql`SELECT c.id, c.label, c.created_at, c.scan_count, c.first_scanned_at, d.name AS department
        FROM codes c LEFT JOIN departments d ON d.id = c.department_id
        ORDER BY c.created_at DESC, c.label LIMIT 500`;
  return Response.json(rows);
}

export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { label, departmentId, quantity } = await req.json();
  const clean = String(label || "").trim().slice(0, 200);
  if (!clean) return Response.json({ error: "Label required" }, { status: 400 });
  const qty = Math.min(100, Math.max(1, Math.floor(Number(quantity)) || 1));
  const labels = Array.from({ length: qty }, (_, i) => (qty > 1 ? `${clean} #${i + 1}` : clean));
  const dept = Number(departmentId) || null;
  const sql = await getDb();
  const rows = await sql`INSERT INTO codes (label, department_id)
    SELECT l, ${dept}::int FROM unnest(${labels}::text[]) AS l RETURNING id, label`;
  const origin = new URL(req.url).origin;
  const codes = await Promise.all(
    rows.map(async (r) => {
      const url = `${origin}/verify?c=${r.id}`;
      return { id: r.id, label: r.label, url, qr: await QRCode.toDataURL(url, { width: 300, margin: 2 }) };
    })
  );
  codes.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
  return Response.json({ codes });
}
