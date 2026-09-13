"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "../../components/Nav";
import { api } from "../../lib/api";
import { useAuthGuard } from "../../lib/useAuthGuard";

const STATUS_BADGE: Record<string, string> = {
  draft: "badge badge-muted",
  scheduled: "badge badge-accent",
  live: "badge badge-success",
  completed: "badge badge-navy",
  archived: "badge badge-muted",
};

function fmt(d: string) {
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminHome() {
  useAuthGuard("admin");
  const [stats, setStats] = useState<any>({});
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api("/admin/dashboard").catch(() => ({})),
      api("/exams/admin").catch(() => []),
    ]).then(([s, e]) => { setStats(s); setExams(e); setLoading(false); });
  }, []);

  const statCards = [
    { label: "Students",        value: stats.students  ?? 0, color: "#2563eb", bg: "#eff6ff", icon: "👨‍🎓" },
    { label: "Exams",           value: stats.exams     ?? 0, color: "#16a34a", bg: "#f0fdf4", icon: "📋" },
    { label: "Attempts",        value: stats.attempts  ?? 0, color: "#d97706", bg: "#fffbeb", icon: "✍️" },
    { label: "Integrity Events",value: stats.integrity ?? 0, color: "#dc2626", bg: "#fef2f2", icon: "🔒" },
  ];

  return (
    <>
      <Nav role="admin" />
      <main className="page">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="section-title">Admin Dashboard</h1>
            <p className="section-sub">Examination management overview</p>
          </div>
          <Link href="/admin/exams/new" className="btn btn-primary">
            + Create Exam
          </Link>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {statCards.map(s => (
            <div key={s.label} className="stat-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: ".8rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>{s.label}</div>
                  <div style={{ fontSize: "2.2rem", fontWeight: 800, color: s.color, lineHeight: 1.1, marginTop: ".35rem" }}>
                    {loading ? "—" : s.value.toLocaleString()}
                  </div>
                </div>
                <div style={{ fontSize: "2rem", opacity: .7 }}>{s.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Exams Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--navy)" }}>All Exams</div>
              <div style={{ fontSize: ".8rem", color: "var(--muted)", marginTop: ".15rem" }}>{exams.length} exam{exams.length !== 1 ? "s" : ""} total</div>
            </div>
            <Link href="/admin/exams/new" className="btn btn-outline btn-sm">+ New</Link>
          </div>
          <div className="table-wrap">
            {loading ? (
              <div className="empty-state">Loading...</div>
            ) : exams.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>📋</div>
                <div style={{ fontWeight: 600, marginBottom: ".25rem" }}>No exams yet</div>
                <div>Create your first exam to get started.</div>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Exam</th>
                    <th>Subject</th>
                    <th>Duration</th>
                    <th>Start</th>
                    <th>Status</th>
                    <th>Questions</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map(e => (
                    <tr key={e._id}>
                      <td style={{ fontWeight: 600, color: "var(--navy)" }}>{e.title}</td>
                      <td style={{ color: "var(--muted)" }}>{e.subject}</td>
                      <td>{e.durationMinutes} min</td>
                      <td style={{ fontSize: ".82rem", color: "var(--muted)" }}>{fmt(e.startTime)}</td>
                      <td><span className={STATUS_BADGE[e.status] ?? "badge badge-muted"}>{e.status}</span></td>
                      <td>{e.questionIds?.length ?? 0}</td>
                      <td>
                        <Link href={`/admin/exams/${e._id}`} className="btn btn-outline btn-sm">
                          Manage
                        </Link>
                      </td>
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
