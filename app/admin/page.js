"use client";
import { useState } from "react";

export default function Admin() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [depts, setDepts] = useState([]);
  const [codes, setCodes] = useState([]);
  const [newDept, setNewDept] = useState("");
  const [label, setLabel] = useState("");
  const [qty, setQty] = useState(1);
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
    const r = await fetch("/api/codes", { method: "POST", headers, body: JSON.stringify({ label, departmentId: deptId, quantity: qty }) });
    const d = await r.json();
    if (!r.ok) return setErr(d.error || "Failed");
    setOut(d.codes);
    setLabel("");
    load();
  }

  function logout() { setAuthed(false); setPw(""); setOut(null); setCodes([]); }

  if (!authed)
    return (
      <div className="card" style={{ maxWidth: 380, margin: "40px auto" }}>
        <h1>Log in</h1>
        <p className="muted">Enter the admin password to manage departments and QR codes.</p>
        <form onSubmit={(e) => { e.preventDefault(); load(); }}>
          <input type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <button className="block" type="submit">Log in</button>
        </form>
        {err && <p className="t-bad" style={{ marginTop: 12 }}>{err}</p>}
      </div>
    );

  return (
    <>
      <div className="row">
        <h1>Dashboard</h1>
        <button className="ghost" onClick={logout}>Log out</button>
      </div>

      <div className="card">
        <h3>Departments</h3>
        <div className="row" style={{ alignItems: "flex-start" }}>
          <input placeholder="New department name" value={newDept} onChange={(e) => setNewDept(e.target.value)} />
          <button onClick={addDept}>Add</button>
        </div>
        <p className="muted">{depts.map((d) => d.name).join(" · ") || "No departments yet"}</p>
      </div>

      <div className="card">
        <h3>New QR code</h3>
        <input placeholder="Label or prefix (e.g. Ticket)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <select value={deptId} onChange={(e) => setDeptId(e.target.value)}>
          <option value="">No department</option>
          {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <p className="muted" style={{ margin: "0 0 6px" }}>How many QR codes? (1 to 100)</p>
        <input type="number" min="1" max="100" value={qty} onChange={(e) => setQty(e.target.value)} />
        <button className="block" onClick={generate}>Generate</button>
        {err && <p className="t-bad" style={{ marginTop: 12 }}>{err}</p>}
      </div>

      {out && (
        <div className="card printable">
          <div className="row no-print">
            <h3>{out.length} QR code{out.length > 1 ? "s" : ""}</h3>
            <button className="ghost" onClick={() => window.print()}>Print</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 16 }}>
            {out.map((c) => (
              <div key={c.id} style={{ textAlign: "center" }}>
                <img src={c.qr} alt={c.label} />
                <p className="muted" style={{ margin: "4px 0" }}>{c.label}</p>
                <a className="no-print" href={c.qr} download={`${c.label}.png`}>Download</a>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="row">
          <h3>Codes</h3>
          <select style={{ width: "auto", margin: 0 }} value={filter} onChange={(e) => { setFilter(e.target.value); load(e.target.value); }}>
            <option value="">All departments</option>
            {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table>
            <thead><tr><th>Label</th><th>Department</th><th>Scans</th></tr></thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id}><td>{c.label}</td><td>{c.department || "—"}</td><td>{c.scan_count}</td></tr>
              ))}
              {!codes.length && <tr><td colSpan="3" className="muted">No codes yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
