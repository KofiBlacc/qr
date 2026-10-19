import QRCode from "qrcode";
import { getDb, isAdmin, isUuid, makeSecret } from "../../../lib/db";

export async function GET(req) {
  if (!isAdmin(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const dept = Number(new URL(req.url).searchParams.get("department")) || null;
  const sql = await getDb();
  const rows = dept
    ? await sql`SELECT c.id, c.label, c.secret, c.zone, c.kind, c.car_number, c.color, (c.photo IS NOT NULL) AS has_photo, c.created_at, c.scan_count, c.first_scanned_at, d.name AS department
        FROM codes c LEFT JOIN departments d ON d.id = c.department_id
        WHERE c.department_id = ${dept} ORDER BY c.created_at DESC, c.label LIMIT 500`
    : await sql`SELECT c.id, c.label, c.secret, c.zone, c.kind, c.car_number, c.color, (c.photo IS NOT NULL) AS has_photo, c.created_at, c.scan_count, c.first_scanned_at, d.name AS department
        FROM codes c LEFT JOIN departments d ON d.id = c.department_id
        ORDER BY c.created_at DESC, c.label LIMIT 500`;
  return Response.json(rows);
}

export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { label, departmentId, quantity } = body;
  const clean = String(label || "").trim().slice(0, 200);
  if (!clean) return Response.json({ error: "Label required" }, { status: 400 });
  const qty = Math.min(100, Math.max(1, Math.floor(Number(quantity)) || 1));
  const labels = Array.from({ length: qty }, (_, i) => (qty > 1 ? `${clean} #${i + 1}` : clean));
  const secrets = labels.map(() => makeSecret());
  const dept = Number(departmentId) || null;
  const sql = await getDb();
  const zone = String(body.zone || "").trim().slice(0, 100) || null;
  const photo =
    typeof body.photo === "string" && body.photo.startsWith("data:image/") && body.photo.length < 400000
      ? body.photo
      : null;
  const carNumber = String(body.carNumber || "").trim().slice(0, 30) || null;
  const color = String(body.color || "").trim().slice(0, 40) || null;
  const kind = body.kind === "car" ? "car" : body.kind === "person" ? "person" : null;
  if (kind === "car" && !carNumber) return Response.json({ error: "Car number required" }, { status: 400 });
  const rows = kind || zone || photo
    ? await sql`INSERT INTO codes (label, department_id, secret, zone, photo, kind, car_number, color)
        VALUES (${labels[0]}, ${dept}, ${secrets[0]}, ${zone}, ${photo}, ${kind}, ${carNumber}, ${color})
        RETURNING id, label, secret`
    : await sql`INSERT INTO codes (label, department_id, secret)
        SELECT t.l, ${dept}::int, t.s FROM unnest(${labels}::text[], ${secrets}::text[]) AS t(l, s)
        RETURNING id, label, secret`;
  const origin = new URL(req.url).origin;
  const codes = await Promise.all(
    rows.map(async (r) => {
      const url = `${origin}/verify?c=${r.id}`;
      return { id: r.id, label: r.label, secret: r.secret, url, qr: await QRCode.toDataURL(url, { width: 300, margin: 2 }) };
    })
  );
  codes.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
  return Response.json({ codes });
}

export async function DELETE(req) {
  if (!isAdmin(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { ids } = await req.json();
  const list = (Array.isArray(ids) ? ids : []).filter(isUuid).slice(0, 500);
  if (!list.length) return Response.json({ error: "Nothing selected" }, { status: 400 });
  const sql = await getDb();
  const rows = await sql`DELETE FROM codes WHERE id = ANY(${list}::uuid[]) RETURNING id`;
  return Response.json({ deleted: rows.length });
}
