"use client";
import { useEffect, useState } from "react";
import Nav from "../../../components/Nav";
import { api } from "../../../lib/api";
import { useAuthGuard } from "../../../lib/useAuthGuard";

function fmt(d: string) {
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function secs(s: number) {
  const m = Math.floor(s / 60); const ss = s % 60;
  return `${m}m ${ss}s`;
}

export default function ResultsPage() {
  useAuthGuard("admin");
  const [attempts, setAttempts] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [filterExam, setFilterExam] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api("/admin/attempts"), api("/exams/admin")])
      .then(([a, e]) => { setAttempts(a); setExams(e); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = attempts.filter(a =>
    (!filterExam || a.examId?._id === filterExam) &&
    (!filterStatus || a.status === filterStatus)
  );

  const passCount = filtered.filter(a => {
    const passing = a.examId?.passingMarks ?? 0;
    return a.score >= passing;
  }).length;

  return (
    <>
      <Nav role="admin" />
      <main className="page">
        <div style={{ marginBottom: "1.75rem" }}>
          <h1 className="section-title">All Results</h1>
          <p className="section-sub">View and analyse all examination attempts</p>
        </div>

        {/* Summary cards */}
        {!loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            {[
              { label: "Total Attempts", value: filtered.length, color: "#2563eb" },
              { label: "Passed", value: passCount, color: "var(--success)" },
              { label: "Failed", value: filtered.filter(a => a.score < (a.examId?.passingMarks ?? 0)).length, color: "var(--danger)" },
              { label: "Auto-submitted", value: filtered.filter(a => a.status === "auto_submitted").length, color: "var(--warning)" },
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
          <select className="input" style={{ width: "auto" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="auto_submitted">Auto-submitted</option>
            <option value="in_progress">In Progress</option>
          </select>
          {(filterExam || filterStatus) && (
            <button className="btn btn-ghost" onClick={() => { setFilterExam(""); setFilterStatus(""); }}>Clear</button>
          )}
        </div>

        <div className="card">
          <div className="table-wrap">
            {loading ? (
              <div className="empty-state">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>📊</div>
                <div style={{ fontWeight: 600 }}>No results yet</div>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Reg. No.</th>
                    <th>Exam</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Pass/Fail</th>
                    <th>Correct</th>
                    <th>Incorrect</th>
                    <th>Time Taken</th>
                    <th>Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a: any) => {
                    const passing = a.examId?.passingMarks ?? 0;
                    const passed = a.score >= passing;
                    return (
                      <tr key={a._id}>
                        <td style={{ fontWeight: 600 }}>{a.studentId?.name ?? "—"}</td>
                        <td style={{ fontFamily: "monospace", fontSize: ".82rem" }}>{a.studentId?.registerNumber ?? "—"}</td>
                        <td style={{ maxWidth: 200 }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {a.examId?.title ?? "—"}
                          </div>
                          <div style={{ fontSize: ".75rem", color: "var(--muted)" }}>{a.examId?.subject}</div>
                        </td>
                        <td>
                          <span className={`badge ${a.status === "submitted" ? "badge-success" : a.status === "auto_submitted" ? "badge-danger" : "badge-warning"}`}>
                            {a.status.replace("_", " ")}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700 }}>{a.score}</td>
                        <td><span className={`badge ${passed ? "badge-success" : "badge-danger"}`}>{passed ? "Pass" : "Fail"}</span></td>
                        <td style={{ color: "var(--success)", fontWeight: 600 }}>{a.correctAnswers}</td>
                        <td style={{ color: "var(--danger)", fontWeight: 600 }}>{a.incorrectAnswers}</td>
                        <td>{secs(a.timeTakenSeconds)}</td>
                        <td style={{ fontSize: ".8rem", color: "var(--muted)" }}>{a.submittedAt ? fmt(a.submittedAt) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
