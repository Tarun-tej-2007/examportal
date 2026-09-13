"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Nav from "../../../../components/Nav";
import { api } from "../../../../lib/api";
import { useAuthGuard } from "../../../../lib/useAuthGuard";

type Tab = "questions" | "space" | "results" | "integrity";

const STATUS_BADGE: Record<string, string> = {
  draft: "badge badge-muted", scheduled: "badge badge-accent",
  live: "badge badge-success", completed: "badge badge-navy", archived: "badge badge-muted",
};
const DIFF_BADGE: Record<string, string> = { easy: "badge-success", medium: "badge-warning", hard: "badge-danger" };
const VIO_BADGE: Record<string, string> = {
  AUTO_SUBMITTED: "badge-danger", RECORDED: "badge-warning",
};

function fmt(d: string) {
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function secs(s: number) {
  const m = Math.floor(s / 60); const ss = s % 60;
  return `${m}m ${ss}s`;
}

export default function ManageExam() {
  useAuthGuard("admin");
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("questions");

  const [exam, setExam] = useState<any>(null);
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [selectedQIds, setSelectedQIds] = useState<string[]>([]);
  const [qSearch, setQSearch] = useState("");
  const [qFilterSubj, setQFilterSubj] = useState("");
  const [savingQ, setSavingQ] = useState(false);

  const [space, setSpace] = useState<any>(null);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [selectedSIds, setSelectedSIds] = useState<string[]>([]);
  const [sSearch, setSSearch] = useState("");
  const [savingSpace, setSavingSpace] = useState(false);

  const [attempts, setAttempts] = useState<any[]>([]);
  const [integrity, setIntegrity] = useState<any[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [loadingIntegrity, setLoadingIntegrity] = useState(false);

  // Load exam + questions + space + students
  useEffect(() => {
    Promise.all([
      api(`/exams/admin/${id}`),
      api("/questions"),
      api(`/exams/${id}/space`),
      api("/students"),
    ]).then(([e, q, s, stu]) => {
      setExam(e);
      setAllQuestions(q);
      setSelectedQIds(e.questionIds || []);
      setSpace(s);
      setSelectedSIds((s.studentIds || []).map((x: any) => x._id));
      setAllStudents(stu);
    }).catch(err => alert(err.message));
  }, [id]);

  // Load attempts when tab switches
  useEffect(() => {
    if (tab === "results" && attempts.length === 0) {
      setLoadingAttempts(true);
      api(`/admin/attempts?examId=${id}`).then(setAttempts).finally(() => setLoadingAttempts(false));
    }
    if (tab === "integrity" && integrity.length === 0) {
      setLoadingIntegrity(true);
      api(`/admin/integrity?examId=${id}`).then(setIntegrity).finally(() => setLoadingIntegrity(false));
    }
  }, [tab]);

  // ── Questions Tab ─────────────────────────────────────────────────────────
  const subjects = [...new Set(allQuestions.map(q => q.subject))];
  const visibleQ = allQuestions.filter(q =>
    (!qFilterSubj || q.subject === qFilterSubj) &&
    (q.questionText.toLowerCase().includes(qSearch.toLowerCase()) ||
     q.subject.toLowerCase().includes(qSearch.toLowerCase()))
  );
  function toggleQ(qid: string) {
    setSelectedQIds(ids => ids.includes(qid) ? ids.filter(x => x !== qid) : [...ids, qid]);
  }
  async function saveQuestions() {
    setSavingQ(true);
    try {
      const updated = await api(`/exams/${id}/questions`, { method: "PATCH", body: JSON.stringify({ questionIds: selectedQIds }) });
      setExam(updated);
      alert(`✓ Saved ${selectedQIds.length} questions. Total marks auto-updated to ${updated.totalMarks}.`);
    } catch (err: any) { alert(err.message); }
    setSavingQ(false);
  }

  // ── Space Tab ─────────────────────────────────────────────────────────────
  const visibleS = allStudents.filter(s =>
    [s.name, s.email, s.registerNumber, s.department].join(" ").toLowerCase().includes(sSearch.toLowerCase())
  );
  async function saveSpace() {
    setSavingSpace(true);
    try {
      const updated = await api(`/exams/${id}/space`, { method: "PATCH", body: JSON.stringify({ studentIds: selectedSIds }) });
      setSpace(updated);
      setSelectedSIds((updated.studentIds || []).map((x: any) => x._id));
      alert(`✓ Exam Space saved — ${selectedSIds.length} student(s) assigned.`);
    } catch (err: any) { alert(err.message); }
    setSavingSpace(false);
  }

  if (!exam) return (
    <>
      <Nav role="admin" />
      <div className="empty-state" style={{ marginTop: "4rem" }}>Loading exam…</div>
    </>
  );

  return (
    <>
      <Nav role="admin" />
      <main className="page">
        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: ".8rem", color: "var(--muted)", marginBottom: ".35rem" }}>
            <a href="/admin" style={{ color: "var(--muted)", textDecoration: "none" }}>Dashboard</a> › Exams
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h1 className="section-title">{exam.title}</h1>
              <div style={{ display: "flex", gap: ".75rem", alignItems: "center", marginTop: ".35rem", flexWrap: "wrap" }}>
                <span className={STATUS_BADGE[exam.status] ?? "badge badge-muted"}>{exam.status}</span>
                <span style={{ fontSize: ".85rem", color: "var(--muted)" }}>{exam.subject}</span>
                <span style={{ fontSize: ".85rem", color: "var(--muted)" }}>{exam.durationMinutes} min</span>
                <span style={{ fontSize: ".85rem", color: "var(--muted)" }}>{exam.totalMarks} marks</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card" style={{ overflow: "visible" }}>
          <div className="tabs" style={{ padding: "0 1.5rem" }}>
            {(["questions", "space", "results", "integrity"] as Tab[]).map(t => (
              <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                {t === "questions" && `📝 Questions (${selectedQIds.length})`}
                {t === "space" && `👥 Exam Space (${selectedSIds.length})`}
                {t === "results" && `📊 Results`}
                {t === "integrity" && `🔒 Integrity`}
              </button>
            ))}
          </div>

          {/* ── Questions Tab ────────────────────────────────────────────── */}
          {tab === "questions" && (
            <div style={{ padding: "1.25rem 1.5rem" }}>
              <div style={{ display: "flex", gap: ".75rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                <input className="input" style={{ flex: 1, minWidth: 220, maxWidth: 360 }}
                  placeholder="Search questions…" value={qSearch} onChange={e => setQSearch(e.target.value)} />
                <select className="input" style={{ width: "auto" }} value={qFilterSubj} onChange={e => setQFilterSubj(e.target.value)}>
                  <option value="">All subjects</option>
                  {subjects.map(s => <option key={s}>{s}</option>)}
                </select>
                <span style={{ fontSize: ".85rem", color: "var(--muted)" }}>
                  {selectedQIds.length} selected
                </span>
                <button className="btn btn-primary" onClick={saveQuestions} disabled={savingQ}>
                  {savingQ ? "Saving…" : "Save Questions"}
                </button>
              </div>

              {allQuestions.length === 0 ? (
                <div className="empty-state">
                  <div>No questions in bank. <a href="/admin/questions" style={{ color: "var(--accent)" }}>Add questions first →</a></div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: ".5rem", maxHeight: "60vh", overflowY: "auto" }}>
                  {visibleQ.map(q => {
                    const checked = selectedQIds.includes(q._id);
                    return (
                      <label key={q._id} style={{
                        display: "flex", alignItems: "flex-start", gap: ".75rem",
                        padding: ".85rem 1rem", borderRadius: "var(--radius-sm)",
                        border: `1.5px solid ${checked ? "var(--navy)" : "var(--border)"}`,
                        background: checked ? "#e8eef7" : "var(--surface)",
                        cursor: "pointer", transition: "all .12s",
                      }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleQ(q._id)}
                          style={{ marginTop: ".2rem", accentColor: "var(--navy)", width: 16, height: 16, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, fontSize: ".9rem" }}>{q.questionText}</div>
                          <div style={{ display: "flex", gap: ".5rem", marginTop: ".35rem", flexWrap: "wrap" }}>
                            <span className="badge badge-navy" style={{ fontSize: ".7rem" }}>{q.subject}</span>
                            <span className={`badge ${DIFF_BADGE[q.difficulty] ?? "badge-muted"}`} style={{ fontSize: ".7rem" }}>{q.difficulty}</span>
                            <span className="badge badge-muted" style={{ fontSize: ".7rem" }}>{q.marks} marks</span>
                            {q.negativeMarks > 0 && <span className="badge badge-danger" style={{ fontSize: ".7rem" }}>-{q.negativeMarks}</span>}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Space Tab ────────────────────────────────────────────────── */}
          {tab === "space" && (
            <div style={{ padding: "1.25rem 1.5rem" }}>
              <div style={{ display: "flex", gap: ".75rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                <input className="input" style={{ flex: 1, minWidth: 220, maxWidth: 360 }}
                  placeholder="Search students…" value={sSearch} onChange={e => setSSearch(e.target.value)} />
                <span style={{ fontSize: ".85rem", color: "var(--muted)" }}>{selectedSIds.length} assigned</span>
                <button className="btn btn-primary" onClick={saveSpace} disabled={savingSpace}>
                  {savingSpace ? "Saving…" : "Save Space"}
                </button>
              </div>
              {allStudents.length === 0 ? (
                <div className="empty-state">
                  No students registered. <a href="/admin/students" style={{ color: "var(--accent)" }}>Add students first →</a>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: ".4rem", maxHeight: "60vh", overflowY: "auto" }}>
                  {visibleS.map(s => {
                    const checked = selectedSIds.includes(s._id);
                    return (
                      <label key={s._id} style={{
                        display: "flex", alignItems: "center", gap: ".75rem",
                        padding: ".75rem 1rem", borderRadius: "var(--radius-sm)",
                        border: `1.5px solid ${checked ? "var(--navy)" : "var(--border)"}`,
                        background: checked ? "#e8eef7" : "var(--surface)",
                        cursor: "pointer", transition: "all .12s",
                      }}>
                        <input type="checkbox" checked={checked}
                          onChange={e => setSelectedSIds(v => e.target.checked ? [...v, s._id] : v.filter(x => x !== s._id))}
                          style={{ accentColor: "var(--navy)", width: 16, height: 16, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: ".9rem" }}>{s.name}</div>
                          <div style={{ fontSize: ".78rem", color: "var(--muted)" }}>
                            {s.registerNumber} · {[s.department, s.year, s.section].filter(Boolean).join(" / ") || "—"}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Results Tab ──────────────────────────────────────────────── */}
          {tab === "results" && (
            <div style={{ padding: "1.25rem 1.5rem" }}>
              {loadingAttempts ? (
                <div className="empty-state">Loading results…</div>
              ) : attempts.length === 0 ? (
                <div className="empty-state">No attempts yet for this exam.</div>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr><th>Student</th><th>Register No.</th><th>Status</th><th>Score</th><th>Correct</th><th>Incorrect</th><th>Time Taken</th><th>Submitted</th></tr>
                    </thead>
                    <tbody>
                      {attempts.map((a: any) => (
                        <tr key={a._id}>
                          <td style={{ fontWeight: 600 }}>{a.studentId?.name ?? "—"}</td>
                          <td style={{ fontFamily: "monospace", fontSize: ".85rem" }}>{a.studentId?.registerNumber ?? "—"}</td>
                          <td><span className={`badge ${a.status === "submitted" ? "badge-success" : a.status === "auto_submitted" ? "badge-danger" : "badge-warning"}`}>{a.status}</span></td>
                          <td style={{ fontWeight: 700 }}>{a.score} / {exam.totalMarks}</td>
                          <td style={{ color: "var(--success)" }}>{a.correctAnswers}</td>
                          <td style={{ color: "var(--danger)" }}>{a.incorrectAnswers}</td>
                          <td>{secs(a.timeTakenSeconds)}</td>
                          <td style={{ fontSize: ".82rem", color: "var(--muted)" }}>{a.submittedAt ? fmt(a.submittedAt) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Integrity Tab ─────────────────────────────────────────────── */}
          {tab === "integrity" && (
            <div style={{ padding: "1.25rem 1.5rem" }}>
              {loadingIntegrity ? (
                <div className="empty-state">Loading logs…</div>
              ) : integrity.length === 0 ? (
                <div className="empty-state">No integrity violations recorded for this exam.</div>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr><th>Student</th><th>Violation</th><th>Details</th><th>Action</th><th>Time</th></tr>
                    </thead>
                    <tbody>
                      {integrity.map((log: any) => (
                        <tr key={log._id}>
                          <td style={{ fontWeight: 600 }}>{log.studentId?.name ?? "—"} <span style={{ fontSize: ".78rem", color: "var(--muted)" }}>({log.studentId?.registerNumber})</span></td>
                          <td><span className="badge badge-warning">{log.type.replace(/_/g, " ")}</span></td>
                          <td style={{ fontSize: ".82rem", color: "var(--muted)" }}>{log.details || "—"}</td>
                          <td><span className={`badge ${VIO_BADGE[log.action] ?? "badge-muted"}`}>{log.action.replace(/_/g, " ")}</span></td>
                          <td style={{ fontSize: ".82rem", color: "var(--muted)" }}>{fmt(log.detectedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Exam Settings summary */}
        <div className="card" style={{ marginTop: "1.25rem" }}>
          <div className="card-header">
            <div style={{ fontWeight: 700, color: "var(--navy)" }}>Exam Settings</div>
          </div>
          <div className="card-body">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: ".75rem" }}>
              {[
                ["Start", fmt(exam.startTime)],
                ["End", fmt(exam.endTime)],
                ["Result Mode", exam.resultMode],
                ["Negative Marking", exam.negativeMarking ? `Yes (${exam.defaultNegativeMarks})` : "No"],
                ["Auto-submit on Violation", exam.security?.autoSubmitOnViolation ? "Yes" : "No"],
                ["Fullscreen Required", exam.security?.requireFullscreen ? "Yes" : "No"],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: ".75rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>{k}</div>
                  <div style={{ fontWeight: 600, marginTop: ".2rem" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
