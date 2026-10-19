"use client";
import { useEffect, useRef, useState } from "react";

export default function Scan() {
  const scanner = useRef(null);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [running, setRunning] = useState(false);
  const [manual, setManual] = useState("");

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

  async function verifyManual(e) {
    e.preventDefault();
    if (!manual.trim()) return;
    if (scanner.current?.isScanning) {
      await scanner.current.stop().catch(() => {});
      setRunning(false);
    }
    setErr("");
    const r = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: manual }),
    });
    setResult(await r.json());
  }

  useEffect(() => {
    start();
    return () => {
      if (scanner.current?.isScanning) scanner.current.stop().catch(() => {});
    };
  }, []);

  const tone = !result ? "" : !result.valid ? "bad" : "ok";

  return (
    <>
      <h1>Scan a QR code</h1>
      <div className="card">
        <div id="reader" />
        {running && <p className="muted">Point the camera at the QR code.</p>}
        {!running && (err || result) && <button className="block" onClick={start}>{result ? "Scan another" : "Try again"}</button>}
        {err && <p className="t-bad">{err}</p>}
      </div>
      <div className="card">
        <h3>QR code damaged or not scanning?</h3>
        <form onSubmit={verifyManual}>
          <input
            placeholder="Type the secret code (e.g. ABCD-EFGH)"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            autoCapitalize="characters"
            autoComplete="off"
          />
          <button className="block" type="submit">Verify code</button>
        </form>
      </div>
      {result && (
        <div className="card status">
          <div className={`icon ${tone}`}>{result.valid ? "✓" : "✕"}</div>
          {result.valid ? (
            <>
              <h1>Valid</h1>
              {result.photo && <img src={result.photo} alt="" style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", margin: "0 auto 12px", display: "block" }} />}
              <p><b>{result.label}</b></p>
              <p className="muted">Department: {result.department || "—"}</p>
              {result.zone && <p className="muted">Zone: {result.zone}</p>}
            </>
          ) : (
            <h1>Invalid code</h1>
          )}
        </div>
      )}
    </>
  );
}
