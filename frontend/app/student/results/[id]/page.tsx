"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "../../../../components/Nav";
import { api } from "../../../../lib/api";
import { useAuthGuard } from "../../../../lib/useAuthGuard";

function secs(s: number) {
  const m = Math.floor(s / 60); const ss = s % 60;
  return `${m}m ${ss}s`;
}

export default function ResultPage() {
  useAuthGuard("student");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [attempt, setAttempt] = useState<any>(null);

  useEffect(() => {
    api(`/attempts/${id}`).then(setAttempt).catch(e => { alert(e.message); router.replace("/student"); });
  }, [id]);

  if (!attempt) return (
    <>
      <Nav role="student" />
      <div className="empty-state" style={{ marginTop: "4rem" }}>Loading results…</div>
    </>
  );

  const exam = attempt.examId ?? {};
  const showScore = exam.showScore !== false;
  const showPF = exam.showPassFail !== false;
  const showAnswers = exam.showCorrectAnswers || exam.showStudentAnswers;
  const passed = attempt.score >= (exam.passingMarks ?? 0);
  const total = exam.totalMarks ?? 0;
  const pct = total > 0 ? Math.round((attempt.score / total) * 100) : 0;

  return (
    <>
      <Nav role="student" />
      <main className="page-sm">
        {/* Score Hero Card */}
        <div className="card" style={{ marginTop: "1rem", overflow: "hidden" }}>
          <div style={{
            background: passed ? "var(--success)" : "var(--danger)",
            padding: "2.5rem 2rem",
            textAlign: "center",
            color: "#fff",
          }}>
            <div style={{ fontSize: "3.5rem", fontWeight: 900, lineHeight: 1 }}>
              {showScore ? attempt.score : "—"}
            </div>
            {showScore && <div style={{ fontSize: "1.1rem", opacity: .8, marginTop: ".35rem" }}>out of {total}</div>}
            {showPF && (
              <div style={{
                display: "inline-block", marginTop: "1rem",
                background: "rgba(255,255,255,.22)", borderRadius: 99,
                padding: ".4rem 1.25rem", fontWeight: 800, fontSize: "1rem", letterSpacing: ".04em"
              }}>
                {passed ? "✓ PASS" : "✗ FAIL"}
              </div>
            )}
            {!showScore && !showPF && (
              <div style={{ marginTop: "1rem", opacity: .8, fontSize: ".9rem" }}>Results will be released by the administrator.</div>
            )}
          </div>

          <div className="card-body">
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div style={{ fontWeight: 800, fontSize: "1.3rem", color: "var(--navy)" }}>{exam.title ?? "Examination"}</div>
              <div style={{ color: "var(--muted)", fontSize: ".85rem", marginTop: ".25rem" }}>{exam.subject}</div>
            </div>

            {/* Score bar */}
            {showScore && (
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".8rem", color: "var(--muted)", marginBottom: ".4rem" }}>
                  <span>Your score</span><span>{pct}%</span>
                </div>
                <div style={{ height: 10, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{
                    width: `${pct}%`, height: "100%", borderRadius: 99,
                    background: pct >= 60 ? "var(--success)" : pct >= 40 ? "var(--warning)" : "var(--danger)",
                    transition: "width 1s ease",
                  }} />
                </div>
              </div>
            )}

            {/* Stat grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: ".75rem", marginBottom: "1.5rem" }}>
              {[
                { label: "Correct", value: attempt.correctAnswers, color: "var(--success)" },
                { label: "Incorrect", value: attempt.incorrectAnswers, color: "var(--danger)" },
                { label: "Unanswered", value: attempt.unanswered, color: "var(--muted)" },
                { label: "Time Taken", value: secs(attempt.timeTakenSeconds), color: "var(--navy)" },
              ].map(s => (
                <div key={s.label} style={{ background: "var(--bg)", borderRadius: "var(--radius-sm)", padding: "1rem", textAlign: "center" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: ".75rem", color: "var(--muted)", marginTop: ".2rem", fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Submission status */}
            <div className="alert alert-info" style={{ marginBottom: "1.5rem" }}>
              <strong>Status:</strong> {attempt.status === "auto_submitted" ? "Auto-submitted due to security violation" : "Manually submitted"} ·
              {attempt.submittedAt ? ` at ${new Date(attempt.submittedAt).toLocaleString("en-IN")}` : ""}
            </div>

            {/* Per-question review */}
            {showAnswers && attempt.questionSnapshot?.length > 0 && (
              <div>
                <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: "1rem" }}>Question Review</div>
                <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
                  {attempt.questionSnapshot.map((q: any, i: number) => {
                    const studentAns = attempt.answers?.find((a: any) => String(a.questionId) === String(q.questionId));
                    const sAns = studentAns?.selectedAnswer;
                    return (
                      <div key={q.questionId} style={{
                        border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "1rem",
                      }}>
                        <div style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--muted)", marginBottom: ".35rem" }}>Q{i + 1} · {q.marks} marks</div>
                        <div style={{ fontWeight: 600, marginBottom: ".6rem" }}>{q.questionText}</div>
                        {exam.showStudentAnswers && (
                          <div style={{ fontSize: ".85rem" }}>
                            <span style={{ color: "var(--muted)" }}>Your answer: </span>
                            <span style={{ fontWeight: 600 }}>{Array.isArray(sAns) ? sAns.join(", ") : (sAns ?? "Not answered")}</span>
                          </div>
                        )}
                        {exam.showCorrectAnswers && q.correctAnswer !== undefined && (
                          <div style={{ fontSize: ".85rem", marginTop: ".25rem" }}>
                            <span style={{ color: "var(--muted)" }}>Correct answer: </span>
                            <span style={{ fontWeight: 600, color: "var(--success)" }}>
                              {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(", ") : q.correctAnswer}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "center" }}>
              <Link href="/student" className="btn btn-primary">← Back to Dashboard</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
