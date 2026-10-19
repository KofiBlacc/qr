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
      setErr("Couldn’t open the camera. Please allow camera access and try again.");
    }
  }

  useEffect(() => {
    start();
    return () => {
      if (scanner.current?.isScanning) scanner.current.stop().catch(() => {});
    };
  }, []);

  const tone = !result ? "" : !result.valid ? "bad" : result.alreadyScanned ? "warn" : "ok";

  return (
    <>
      <h1>Scan a QR code</h1>
      <div className="card">
        <div id="reader" />
        {running && <p className="muted">Point the camera at the QR code.</p>}
        {!running && (err || result) && <button className="block" onClick={start}>{result ? "Scan another" : "Try again"}</button>}
        {err && <p className="t-bad">{err}</p>}
      </div>
      {result && (
        <div className="card status">
          <div className={`icon ${tone}`}>{result.valid ? (result.alreadyScanned ? "!" : "✓") : "✕"}</div>
          {result.valid ? (
            <>
              <h1>{result.alreadyScanned ? "Valid, already scanned" : "Valid"}</h1>
              <p><b>{result.label}</b></p>
              <p className="muted">Department: {result.department || "—"}</p>
              <p className="muted">
                {result.alreadyScanned
                  ? `Scan #${result.scanCount}. First scanned ${new Date(result.firstScannedAt).toLocaleString()}`
                  : "First scan recorded"}
              </p>
            </>
          ) : (
            <h1>Invalid code</h1>
          )}
        </div>
      )}
    </>
  );
}
