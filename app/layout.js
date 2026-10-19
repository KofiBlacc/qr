export const metadata = { title: "QR Verify" };

const css = `
:root{--bg:#f6f7fb;--card:#fff;--text:#14161f;--muted:#6b7280;--accent:#4f46e5;--line:#e5e7eb;--ok:#16a34a;--bad:#dc2626;--warn:#d97706}
@media(prefers-color-scheme:dark){:root{--bg:#0f1117;--card:#181b25;--text:#f3f4f6;--muted:#9ca3af;--accent:#818cf8;--line:#2a2f3d}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;line-height:1.5}
.top{display:flex;justify-content:space-between;align-items:center;max-width:720px;margin:0 auto;padding:16px 20px}
.brand{font-weight:700;font-size:18px;color:var(--text);text-decoration:none}
.login{padding:8px 18px;border:1px solid var(--line);border-radius:999px;color:var(--text);text-decoration:none;font-size:14px;font-weight:500;background:var(--card)}
main{max-width:720px;margin:0 auto;padding:8px 20px 48px}
h1{font-size:28px;margin:8px 0 12px;line-height:1.2}
h3{margin:0 0 12px;font-size:17px}
p{margin:0 0 12px}
.muted{color:var(--muted);font-size:14px}
.hero{text-align:center;padding:48px 0 24px}
.hero p{color:var(--muted);max-width:360px;margin:0 auto 28px}
button,.btn{display:inline-block;padding:12px 22px;border:0;border-radius:12px;background:var(--accent);color:#fff;font-size:16px;font-weight:600;text-decoration:none;cursor:pointer}
button.ghost{background:transparent;color:var(--text);border:1px solid var(--line)}
.block{display:block;width:100%;text-align:center}
.big{padding:16px 36px;font-size:18px}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px;margin:16px 0}
input,select{width:100%;padding:12px 14px;margin:0 0 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--text);font-size:16px}
.row{display:flex;gap:10px;align-items:center;justify-content:space-between}
.status{text-align:center;padding:12px 0}
.icon{width:64px;height:64px;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:32px;color:#fff}
.ok{background:var(--ok)}.bad{background:var(--bad)}.warn{background:var(--warn)}
.t-bad{color:var(--bad)}
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;color:var(--muted);font-weight:500;padding:8px 6px;border-bottom:1px solid var(--line)}
td{padding:10px 6px;border-bottom:1px solid var(--line)}
img{max-width:100%;border-radius:8px}
#reader{border-radius:12px;overflow:hidden}
@media print{body *{visibility:hidden}.printable,.printable *{visibility:visible}.no-print,.no-print *{visibility:hidden}.printable{position:absolute;left:0;top:0;width:100%;border:0}}
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{css}</style>
      </head>
      <body>
        <header className="top">
          <a className="brand" href="/">QR Verify</a>
          <a className="login" href="/admin">Log in</a>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
