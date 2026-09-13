"use client";
import { useEffect, useState } from "react";
import Nav from "../../../components/Nav";
import { api } from "../../../lib/api";
import { useAuthGuard } from "../../../lib/useAuthGuard";

function fmt(d: string) {
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const VIO_LABELS: Record<string, string> = {
  TAB_SWITCH: "Tab Switch", WINDOW_BLUR: "Window Blur", FULLSCREEN_EXIT: "Fullscreen Exit",
  PAGE_HIDDEN: "Page Hidden", NAVIGATION: "Navigation", DUPLICATE_SESSION: "Duplicate Session", OTHER: "Other",
};

export default function IntegrityPage() {
  useAuthGuard("admin");
  const [logs, setLogs] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [filterExam, setFilterExam] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api("/admin/integrity"), api("/exams/admin")])
      .then(([l, e]) => { setLogs(l); setExams(e); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l =>
    (!filterExam || l.examId?._id === filterExam) &&
    (!filterType || l.type === filterType) &&
    (!filterAction || l.action === filterAction)
  );

  return (
    <>
      <Nav role="admin" />
      <main className="page">
        <div style={{ marginBottom: "1.75rem" }}>
          <h1 className="section-title">Integrity Logs</h1>
          <p className="section-sub">All security violations recorded during examinations</p>
        </div>

        {/* Summary */}
        {!loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              { label: "Total Events", value: filtered.length, color: "var(--navy)" },
              { label: "Auto-submitted", value: filtered.filter(l => l.action === "AUTO_SUBMITTED").length, color: "var(--danger)" },
              { label: "Recorded Only", value: filtered.filter(l => l.action === "RECORDED").length, color: "var(--warning)" },
              { label: "Students Affected", value: new Set(filtered.map(l => l.studentId?._id)).size, color: "#2563eb" },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>{s.label}</div>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: s.color, lineHeight: 1.1, marginTop: ".3rem" }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: ".75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <select className="input" style={{ width: "auto", minWidth: 200 }} value={filterExam} onChange={e => setFilterExam(e.target.value)}>
            <option value="">All Exams</option>
            {exams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
          </select>
          <select className="input" style={{ width: "auto" }} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Violation Types</option>
            {Object.entries(VIO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="input" style={{ width: "auto" }} value={filterAction} onChange={e => setFilterAction(e.target.value)}>
            <option value="">All Actions</option>
            <option value="AUTO_SUBMITTED">Auto-submitted</option>
            <option value="RECORDED">Recorded Only</option>
          </select>
          {(filterExam || filterType || filterAction) && (
            <button className="btn btn-ghost" onClick={() => { setFilterExam(""); setFilterType(""); setFilterAction(""); }}>Clear</button>
          )}
        </div>

        <div className="card">
          <div className="table-wrap">
            {loading ? (
              <div className="empty-state">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>🔒</div>
                <div style={{ fontWeight: 600 }}>No integrity events found</div>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Exam</th>
                    <th>Violation Type</th>
                    <th>Details</th>
                    <th>Action Taken</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log: any) => (
                    <tr key={log._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{log.studentId?.name ?? "—"}</div>
                        <div style={{ fontSize: ".78rem", color: "var(--muted)" }}>{log.studentId?.registerNumber}</div>
                      </td>
                      <td style={{ fontSize: ".85rem" }}>{log.examId?.title ?? "—"}</td>
                      <td><span className="badge badge-warning">{VIO_LABELS[log.type] ?? log.type}</span></td>
                      <td style={{ fontSize: ".82rem", color: "var(--muted)", maxWidth: 200 }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {log.details || "—"}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${log.action === "AUTO_SUBMITTED" ? "badge-danger" : "badge-warning"}`}>
                          {log.action === "AUTO_SUBMITTED" ? "Auto-submitted" : "Recorded"}
                        </span>
                      </td>
                      <td style={{ fontSize: ".82rem", color: "var(--muted)" }}>{fmt(log.detectedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
