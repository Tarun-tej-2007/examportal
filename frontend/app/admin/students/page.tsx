"use client";
import { useEffect, useRef, useState } from "react";
import Nav from "../../../components/Nav";
import { api } from "../../../lib/api";
import { useAuthGuard } from "../../../lib/useAuthGuard";

type Student = {
  _id: string; name: string; email: string; registerNumber: string;
  department?: string; year?: string; section?: string; status?: string;
};

const blank = { name: "", email: "", registerNumber: "", department: "", year: "", section: "" };

export default function StudentsPage() {
  useAuthGuard("admin");
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...blank });
  const [saving, setSaving] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  const load = () => api("/students").then(s => { setStudents(s); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = students.filter(s =>
    [s.name, s.email, s.registerNumber, s.department].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  async function addStudent(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      await api("/students", { method: "POST", body: JSON.stringify(form) });
      setForm({ ...blank }); setShowModal(false); load();
    } catch (err: any) { alert(err.message); }
    setSaving(false);
  }

  async function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const text = await file.text();
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim().replace(/\r/g, ""));
    const rows = lines.slice(1).map(line => {
      const vals = line.split(",").map(v => v.trim().replace(/\r/g, ""));
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] || ""]));
    }).filter(r => r.name && r.email && r.registerNumber);
    if (!rows.length) { alert("No valid rows found. Ensure headers: name,email,registerNumber,department,year,section"); return; }
    try {
      const result = await api("/students/import", { method: "POST", body: JSON.stringify({ rows }) });
      setImportResult(result); load();
    } catch (err: any) { alert(err.message); }
    e.target.value = "";
  }

  return (
    <>
      <Nav role="admin" />
      <main className="page">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="section-title">Students</h1>
            <p className="section-sub">{students.length} student{students.length !== 1 ? "s" : ""} registered</p>
          </div>
          <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
            <button className="btn btn-outline" onClick={() => csvRef.current?.click()}>
              ⬆ Import CSV
            </button>
            <input ref={csvRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleCSV} />
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              + Add Student
            </button>
          </div>
        </div>

        {importResult && (
          <div className={`alert ${importResult.errors?.length ? "alert-warning" : "alert-success"}`} style={{ marginBottom: "1rem" }}>
            Import complete: <strong>{importResult.created}</strong> created, <strong>{importResult.skipped}</strong> skipped
            {importResult.errors?.length > 0 && ` — ${importResult.errors.length} error(s)`}
            <button onClick={() => setImportResult(null)} style={{ float: "right", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>×</button>
          </div>
        )}

        {/* CSV format hint */}
        <div className="alert alert-info" style={{ marginBottom: "1.25rem", fontSize: ".82rem" }}>
          <strong>CSV format:</strong> name, email, registerNumber, department, year, section &nbsp;·&nbsp; Default password = register number
        </div>

        {/* Search */}
        <div style={{ marginBottom: "1rem" }}>
          <input className="input" style={{ maxWidth: 380 }} placeholder="Search by name, email, register number…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="card">
          <div className="table-wrap">
            {loading ? (
              <div className="empty-state">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>👨‍🎓</div>
                <div style={{ fontWeight: 600 }}>{search ? "No students match your search" : "No students yet"}</div>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Register No.</th>
                    <th>Dept / Year / Sec</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s._id}>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td style={{ color: "var(--muted)", fontSize: ".85rem" }}>{s.email}</td>
                      <td style={{ fontFamily: "monospace", fontSize: ".85rem" }}>{s.registerNumber}</td>
                      <td style={{ fontSize: ".85rem", color: "var(--muted)" }}>
                        {[s.department, s.year, s.section].filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td>
                        <span className={`badge ${s.status === "blocked" ? "badge-danger" : "badge-success"}`}>
                          {s.status ?? "active"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Add Student Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="card-header" style={{ borderRadius: "14px 14px 0 0" }}>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--navy)" }}>Add New Student</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={addStudent} style={{ padding: "1.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                {(["name", "email", "registerNumber", "department", "year", "section"] as const).map(k => (
                  <label key={k}>
                    <span className="input-label">{k === "registerNumber" ? "Register No." : k}</span>
                    <input
                      className="input"
                      required={["name", "email", "registerNumber"].includes(k)}
                      value={form[k]}
                      onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                      placeholder={k === "registerNumber" ? "e.g. 22CS001" : ""}
                    />
                  </label>
                ))}
              </div>
              <div className="alert alert-info" style={{ fontSize: ".8rem", marginBottom: "1rem" }}>
                Default password will be set to the register number.
              </div>
              <div style={{ display: "flex", gap: ".75rem", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Creating…" : "Create Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
