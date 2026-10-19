import QRCode from "qrcode";
import { isAdmin, isUuid } from "../../../../lib/db";

// Re-creates the QR image for existing codes (the QR only holds the code's ID, so it is identical every time).
export async function POST(req) {
  if (!isAdmin(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { ids } = await req.json();
  const list = (Array.isArray(ids) ? ids : []).filter(isUuid).slice(0, 200);
  const origin = new URL(req.url).origin;
  const qrs = await Promise.all(
    list.map(async (id) => ({ id, qr: await QRCode.toDataURL(`${origin}/verify?c=${id}`, { width: 300, margin: 2 }) }))
  );
  return Response.json({ qrs });
}
