import { getDb, isUuid, normSecret } from "../../../lib/db";

// Scanning (or typing the secret code) records a check-in: it counts the scan and remembers the first one.
export async function POST(req) {
  const { code, secret } = await req.json();
  const sql = await getDb();
  let row;
  if (secret) {
    const s = normSecret(secret);
    if (s.length < 6) return Response.json({ valid: false });
    [row] = await sql`SELECT c.id, c.label, c.scan_count, c.first_scanned_at, d.name AS department
      FROM codes c LEFT JOIN departments d ON d.id = c.department_id WHERE c.secret = ${s}`;
  } else if (isUuid(code)) {
    [row] = await sql`SELECT c.id, c.label, c.scan_count, c.first_scanned_at, d.name AS department
      FROM codes c LEFT JOIN departments d ON d.id = c.department_id WHERE c.id = ${code}`;
  }
  if (!row) return Response.json({ valid: false });
  await sql`UPDATE codes SET scan_count = scan_count + 1,
    first_scanned_at = COALESCE(first_scanned_at, now()), last_scanned_at = now() WHERE id = ${row.id}`;
  return Response.json({
    valid: true,
    label: row.label,
    department: row.department,
    alreadyScanned: row.scan_count > 0,
    firstScannedAt: row.first_scanned_at,
    scanCount: row.scan_count + 1,
  });
}
