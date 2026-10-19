import { getDb, isUuid } from "../../../lib/db";

// Scanning records a check-in: it counts the scan and remembers the first one.
export async function POST(req) {
  const { code } = await req.json();
  if (!isUuid(code)) return Response.json({ valid: false });
  const sql = await getDb();
  const [row] = await sql`SELECT c.label, c.scan_count, c.first_scanned_at, d.name AS department
    FROM codes c LEFT JOIN departments d ON d.id = c.department_id WHERE c.id = ${code}`;
  if (!row) return Response.json({ valid: false });
  await sql`UPDATE codes SET scan_count = scan_count + 1,
    first_scanned_at = COALESCE(first_scanned_at, now()), last_scanned_at = now() WHERE id = ${code}`;
  return Response.json({
    valid: true,
    label: row.label,
    department: row.department,
    alreadyScanned: row.scan_count > 0,
    firstScannedAt: row.first_scanned_at,
    scanCount: row.scan_count + 1,
  });
}
