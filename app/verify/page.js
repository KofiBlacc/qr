import { getDb, isUuid } from "../../lib/db";

export const dynamic = "force-dynamic";

// Read-only status page (opened from a phone’s normal camera app). It does not count a scan.
export default async function Verify({ searchParams }) {
  const code = searchParams.c || "";
  let row = null;
  if (isUuid(code)) {
    const sql = await getDb();
    [row] = await sql`SELECT c.label, c.scan_count, c.first_scanned_at, d.name AS department
      FROM codes c LEFT JOIN departments d ON d.id = c.department_id WHERE c.id = ${code}`;
  }
  return (
    <div className="card status">
      <div className={`icon ${row ? "ok" : "bad"}`}>{row ? "✓" : "✕"}</div>
      {row ? (
        <>
          <h1>Valid</h1>
          <p><b>{row.label}</b></p>
          <p className="muted">Department: {row.department || "—"}</p>
          <p className="muted">
            {row.scan_count > 0
              ? `Scanned ${row.scan_count} time(s). First: ${new Date(row.first_scanned_at).toLocaleString()}`
              : "Not scanned yet"}
          </p>
        </>
      ) : (
        <h1>Invalid code</h1>
      )}
      <a className="btn block" href="/scan">Scan a QR code</a>
    </div>
  );
}
