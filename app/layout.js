export const metadata = { title: "QR Verify" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          body{font-family:system-ui,sans-serif;margin:0;background:#f5f6f8;color:#1a1a1a}
          main{max-width:480px;margin:0 auto;padding:24px 16px}
          a.btn,button{display:block;width:100%;box-sizing:border-box;text-align:center;padding:14px;margin:10px 0;border:0;border-radius:10px;background:#1d4ed8;color:#fff;font-size:16px;text-decoration:none;cursor:pointer}
          input{width:100%;box-sizing:border-box;padding:12px;margin:6px 0;border:1px solid #ccc;border-radius:8px;font-size:16px}
          .card{background:#fff;border-radius:12px;padding:16px;margin:16px 0}
          .ok{color:#15803d}.bad{color:#b91c1c}
          img{max-width:100%}
        `}</style>
      </head>
      <body><main>{children}</main></body>
    </html>
  );
}
