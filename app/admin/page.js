"use client";
import { useState } from "react";

export default function Admin() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [depts, setDepts] = useState([]);
  const [codes, setCodes] = useState([]);
  const [newDept, setNewDept] = useState("");
  const [label, setLabel] = useState("");
  const [deptId, setDeptId] = useState("");
  const [filter, setFilter] = useState("");
  const [out, setOut] = useState(null);
  const [err, setErr] = useState("");

  const headers = { "Content-Type": "application/json", "x-admin-password": pw };

  async function load(f = filter) {
    setErr("");
    const d = await fetch("/api/departments", { headers });
    if (!d.ok) {
      setAuthed(false);
      return setErr(d.status === 401 ? "Wrong password" : "Server error. Check DATABASE_URL.");
    }
    setDepts(await d.json());
    setAuthed(true);
    const c = await fetch("/api/codes" + (f ? `?department=${f}` : ""), { headers });
    setCodes(c.ok ? await c.json() : []);
  }

  async function addDept() {
    if (!newDept.trim()) return;
    await fetch("/api/departments", { method: "POST", headers, body: JSON.stringify({ name: newDept }) });
    setNewDept("");
    load();
  }

  async function generate() {
    setErr(""); setOut(null);
    const r = await fetch("/api/codes", { method: "POST", headers, body: JSON.stringify({ label, departmentId: deptId }) });
    const d = await r.json();
    if (!r.ok) return setErr(d.error || "Failed");
    setOut(d);
    setLabel("");
    load();
  }

  if (!authed)
    return (
      <>
        <h1>Admin</h1>
        <input type="password" placeholder="Admin password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <button onClick={() => load()}>Log in</button>
        {err && <p className="bad">{err}</p>}
        <a href="/">← Home</a>
      </>
    );

  return (
    <>
      <h1>Admin</h1>

      <div className="card">
        <h3>Departments</h3>
        <input placeholder="New department name" value={newDept} onChange={(e) => setNewDept(e.target.value)} />
        <button onClick={addDept}>Add department</button>
        <small>{depts.map((d) => d.name).join(", ") || "None yet"}</small>
      </div>

      <div className="card">
        <h3>Generate QR code</h3>
        <input placeholder="Label (name, ticket, certificate no.)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <select value={deptId} onChange={(e) => setDeptId(e.target.value)} style={{ width: "100%", padding: 12 }}>
          <option value="">No department</option>
          {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button onClick={generate}>Generate</button>
        {err && <p className="bad">{err}</p>}
        {out && (
          <>
            <img src={out.qr} alt="QR code" />
            <a className="btn" href={out.qr} download="qr-code.png">Download PNG</a>
          </>
        )}
      </div>

      <div className="card">
        <h3>Codes</h3>
        <select value={filter} onChange={(e) => { setFilter(e.target.value); load(e.target.value); }} style={{ width: "100%", padding: 12 }}>
          <option value="">All departments</option>
          {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 14, marginTop: 8 }}>
            <thead><tr><th align="left">Label</th><th align="left">Dept</th><th>Scans</th></tr></thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id}><td>{c.label}</td><td>{c.department || "—"}</td><td align="center">{c.scan_count}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <a href="/">← Home</a>
    </>
  );
}
