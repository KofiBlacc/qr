"use client";
import { useEffect, useRef, useState } from "react";

export default function Scan() {
  const scanner = useRef(null);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [running, setRunning] = useState(false);

  async function start() {
    setResult(null); setErr("");
    const { Html5Qrcode } = await import("html5-qrcode");
    const s = new Html5Qrcode("reader");
    scanner.current = s;
    try {
      await s.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, async (text) => {
        await s.stop();
        setRunning(false);
        let code = text;
        try { code = new URL(text).searchParams.get("c") || text; } catch {}
        const r = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        setResult(await r.json());
      });
      setRunning(true);
    } catch {
      setErr("Could not open the camera. Please allow camera access.");
    }
  }

  useEffect(() => () => {
    if (scanner.current?.isScanning) scanner.current.stop().catch(() => {});
  }, []);

  return (
    <>
      <h1>Scan QR code</h1>
      <div id="reader" />
      {!running && <button onClick={start}>{result ? "Scan another" : "Start camera"}</button>}
      {err && <p className="bad">{err}</p>}
      {result && (
        <div className="card">
          {result.valid ? (
            <>
              <h2 className={result.alreadyScanned ? "bad" : "ok"}>
                {result.alreadyScanned ? "⚠ Valid, but already scanned" : "✓ Valid"}
              </h2>
              <p><b>{result.label}</b></p>
              <p>Department: {result.department || "—"}</p>
              <small>
                {result.alreadyScanned
                  ? `Scan #${result.scanCount}. First scanned ${new Date(result.firstScannedAt).toLocaleString()}`
                  : "First scan recorded"}
              </small>
            </>
          ) : (
            <h2 className="bad">✗ Invalid code</h2>
          )}
        </div>
      )}
      <a href="/">← Home</a>
    </>
  );
}
