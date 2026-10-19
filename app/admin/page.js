"use client";
import { useState } from "react";

const fmt = (s) => (s || "").replace(/(.{4})(.{4})/, "$1-$2");

// Draws the secret code and label onto the QR image itself, so the downloaded/printed PNG carries them.
function drawCard(c) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.width, h = img.height + 64;
      const cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      const g = cv.getContext("2d");
      g.fillStyle = "#fff"; g.fillRect(0, 0, w, h);
      g.drawImage(img, 0, 0);
      g.textAlign = "center";
      g.fillStyle = "#000"; g.font = "bold 28px monospace";
      g.fillText(fmt(c.secret), w / 2, img.height + 8, w - 20);
      g.fillStyle = "#555"; g.font = "16px sans-serif";
      g.fillText(c.label, w / 2, img.height + 40, w - 20);
      resolve(cv.toDataURL("image/png"));
    };
    img.src = c.qr;
  });
}

export default function Admin() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [depts, setDepts] = useState([]);
  const [codes, setCodes] = useState([]);
  const [newDept, setNewDept] = useState("");
  const [label, setLabel] = useState("");
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState([]);
  const [pName, setPName] = useState("");
  const [pDept, setPDept] = useState("");
  const [pZone, setPZone] = useState("");
  const [pPhoto, setPPhoto] = useState("");
  const [perr, setPerr] = useState("");
  const [fileKey, setFileKey] = useState(0);
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
    setSelected([]);
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
    setOut(await Promise.all(d.codes.map(async (c) => ({ ...c, card: await drawCard(c) }))));
    setLabel("");
    load();
  }

  function readPhoto(file) {
    if (!file) return setPPhoto("");
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 240 / Math.max(img.width, img.height));
        const cv = document.createElement("canvas");
        cv.width = Math.round(img.width * scale);
        cv.height = Math.round(img.height * scale);
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        setPPhoto(cv.toDataURL("image/jpeg", 0.8));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  }

  async function registerPerson() {
    setPerr(""); setOut(null);
    if (!pName.trim()) return setPerr("Enter the person’s name");
    const r = await fetch("/api/codes", {
      method: "POST", headers,
      body: JSON.stringify({ label: pName, departmentId: pDept, zone: pZone, photo: pPhoto, quantity: 1 }),
    });
    const d = await r.json();
    if (!r.ok) return setPerr(d.error || "Failed");
    setOut(await Promise.all(d.codes.map(async (c) => ({ ...c, card: await drawCard(c) }))));
    setPName(""); setPZone(""); setPPhoto(""); setFileKey((k) => k + 1);
    load();
  }

  async function removeDept(d) {
    if (!confirm(`Delete the department “${d.name}”? Its codes will be kept but left without a department.`)) return;
    await fetch("/api/departments", { method: "DELETE", headers, body: JSON.stringify({ id: d.id }) });
    const f = filter === String(d.id) ? "" : filter;
    setFilter(f);
    if (deptId === String(d.id)) setDeptId("");
    if (pDept === String(d.id)) setPDept("");
    load(f);
  }

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleAll = () => setSelected(selected.length === codes.length ? [] : codes.map((c) => c.id));

  async function removeSelected() {
    if (!confirm(`Delete ${selected.length} QR code(s)? This can’t be undone.`)) return;
    const r = await fetch("/api/codes", { method: "DELETE", headers, body: JSON.stringify({ ids: selected }) });
    if (!r.ok) return setErr("Couldn’t delete the selected codes.");
    setSelected([]);
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
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {depts.map((d) => (
            <span key={d.id} style={{ border: "1px solid var(--line)", borderRadius: 999, padding: "4px 6px 4px 12px", fontSize: 14, display: "inline-flex", alignItems: "center", gap: 4 }}>
              {d.name}
              <button className="ghost" style={{ padding: "0 8px", border: 0, fontSize: 18, color: "var(--bad)" }} onClick={() => removeDept(d)} aria-label={`Delete ${d.name}`}>×</button>
            </span>
          ))}
          {!depts.length && <span className="muted">No departments yet</span>}
        </div>
      </div>

      <div className="card">
        <h3>Register a person</h3>
        <input placeholder="Full name" value={pName} onChange={(e) => setPName(e.target.value)} />
        <select value={pDept} onChange={(e) => setPDept(e.target.value)}>
          <option value="">No department</option>
          {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <input placeholder="Zone" value={pZone} onChange={(e) => setPZone(e.target.value)} />
        <p className="muted" style={{ margin: "0 0 6px" }}>Photo</p>
        <input key={fileKey} type="file" accept="image/*" onChange={(e) => readPhoto(e.target.files[0])} />
        {pPhoto && <img src={pPhoto} alt="Preview" width="96" style={{ borderRadius: 12, display: "block", marginBottom: 12 }} />}
        <button className="block" onClick={registerPerson}>Register &amp; generate QR</button>
        {perr && <p className="t-bad" style={{ marginTop: 12 }}>{perr}</p>}
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
                <img src={c.card} alt={c.label} />
                <a className="no-print" href={c.card} download={`${c.label}.png`}>Download</a>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="row">
          <h3>Codes{selected.length > 0 ? ` (${selected.length} selected)` : ""}</h3>
          <select style={{ width: "auto", margin: 0 }} value={filter} onChange={(e) => { setFilter(e.target.value); load(e.target.value); }}>
            <option value="">All departments</option>
            {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        {selected.length > 0 && (
          <button className="ghost" style={{ marginTop: 12, color: "var(--bad)", borderColor: "var(--bad)" }} onClick={removeSelected}>
            Delete selected ({selected.length})
          </button>
        )}
        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table>
            <thead><tr><th><input type="checkbox" style={{ width: "auto", margin: 0 }} checked={codes.length > 0 && selected.length === codes.length} onChange={toggleAll} /></th><th>Label</th><th>Department</th><th>Zone</th><th>Scans</th><th>Secret</th></tr></thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id}><td><input type="checkbox" style={{ width: "auto", margin: 0 }} checked={selected.includes(c.id)} onChange={() => toggle(c.id)} /></td><td>{c.label}</td><td>{c.department || "—"}</td><td>{c.zone || "—"}</td><td>{c.scan_count}</td><td style={{ fontFamily: "monospace" }}>{fmt(c.secret)}</td></tr>
              ))}
              {!codes.length && <tr><td colSpan="6" className="muted">No codes yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
