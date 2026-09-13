"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "../../components/Nav";
import { api } from "../../lib/api";
import { useAuthGuard } from "../../lib/useAuthGuard";

function fmt(d: string) {
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function secs(s: number) {
  const m = Math.floor(s / 60); const ss = s % 60;
  return `${m}m ${ss}s`;
}

function ExamStatusChip({ exam }: { exam: any }) {
  const now = Date.now();
  const start = new Date(exam.startTime).getTime();
  const end = new Date(exam.endTime).getTime();
  if (now < start) return <span className="badge badge-accent">Upcoming</span>;
  if (now > end) return <span className="badge badge-muted">Ended</span>;
  return <span className="badge badge-success">Live Now</span>;
}

export default function StudentDashboard() {
  useAuthGuard("student");
  const [exams, setExams] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api("/exams/student/available").catch(() => []),
      api("/attempts/student/history/all").catch(() => []),
    ]).then(([e, h]) => {
      // Only show exams that haven't ended yet
      const now = Date.now();
      setExams(e.filter((ex: any) => new Date(ex.endTime).getTime() > now));
      setHistory(h);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <Nav role="student" />
      <main className="page">
        <div style={{ marginBottom: "1.75rem" }}>
          <h1 className="section-title">My Dashboard</h1>
          <p className="section-sub">Your assigned examinations and past results</p>
        </div>

        {/* Available Exams */}
        <section style={{ marginBottom: "2rem" }}>
          <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--navy)", marginBottom: "1rem" }}>
            Available Examinations
          </div>
          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : exams.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>📭</div>
                <div style={{ fontWeight: 600 }}>No exams assigned to you currently</div>
                <div>Contact your administrator to be added to an exam.</div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
              {exams.map(e => {
                const now = Date.now();
                const start = new Date(e.startTime).getTime();
                const end = new Date(e.endTime).getTime();
                const canStart = now >= start && now <= end;
                const attempted = history.some((a: any) => a.examId?._id === e._id);
                return (
                  <div key={e._id} className="card card-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: ".35rem" }}>
                        <ExamStatusChip exam={e} />
                        {attempted && <span className="badge badge-navy">Attempted</span>}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--navy)" }}>{e.title}</div>
                      <div style={{ fontSize: ".85rem", color: "var(--muted)", marginTop: ".2rem" }}>
                        {e.subject} · {e.durationMinutes} min · {e.totalMarks} marks
                      </div>
                      <div style={{ fontSize: ".8rem", color: "var(--muted)", marginTop: ".2rem" }}>
                        {fmt(e.startTime)} → {fmt(e.endTime)}
                      </div>
                    </div>
                    <div>
                      {attempted ? (
                        <span className="badge badge-muted" style={{ padding: ".5rem 1rem", fontSize: ".82rem" }}>Already Attempted</span>
                      ) : (
                        <Link href={`/student/exams/${e._id}`}
                          className={`btn ${canStart ? "btn-primary" : "btn-outline"}`}
                          style={{ pointerEvents: canStart ? "auto" : "none", opacity: canStart ? 1 : .55 }}>
                          {canStart ? "Start Exam →" : "Not Started Yet"}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Past Attempts */}
        {history.length > 0 && (
          <section>
            <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--navy)", marginBottom: "1rem" }}>
              Past Attempts
            </div>
            <div className="card">
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Exam</th><th>Subject</th><th>Score</th><th>Result</th><th>Time Taken</th><th>Submitted</th><th></th></tr>
                  </thead>
                  <tbody>
                    {history.map((a: any) => {
                      const passing = a.examId?.passingMarks ?? 0;
                      const totalMarks = a.examId?.totalMarks ?? 100;
                      const showScore = a.examId?.showScore;
                      const showPF = a.examId?.showPassFail;
                      const passed = a.score >= passing;
                      return (
                        <tr key={a._id}>
                          <td style={{ fontWeight: 600 }}>{a.examId?.title ?? "—"}</td>
                          <td style={{ color: "var(--muted)", fontSize: ".85rem" }}>{a.examId?.subject}</td>
                          <td style={{ fontWeight: 700 }}>
                            {showScore ? `${a.score} / ${totalMarks}` : "—"}
                          </td>
                          <td>
                            {showPF
                              ? <span className={`badge ${passed ? "badge-success" : "badge-danger"}`}>{passed ? "Pass" : "Fail"}</span>
                              : <span className="badge badge-muted">Pending</span>
                            }
                          </td>
                          <td>{secs(a.timeTakenSeconds)}</td>
                          <td style={{ fontSize: ".82rem", color: "var(--muted)" }}>{a.submittedAt ? fmt(a.submittedAt) : "—"}</td>
                          <td>
                            <Link href={`/student/results/${a._id}`} className="btn btn-outline btn-sm">
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
