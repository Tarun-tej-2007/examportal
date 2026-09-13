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
                <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: "1rem", fontSize: "1.05rem" }}>Question Review</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {attempt.questionSnapshot.map((q: any, i: number) => {
                    const studentAns = attempt.answers?.find((a: any) => String(a.questionId) === String(q.questionId));
                    const sAns = studentAns?.selectedAnswer;
                    const cAns = q.correctAnswer;

                    // determine if student got it right
                    const answered = sAns !== undefined && sAns !== null && sAns !== "";
                    const isCorrect = answered && (
                      Array.isArray(cAns)
                        ? JSON.stringify([...cAns].sort()) === JSON.stringify([...(Array.isArray(sAns) ? sAns : [sAns])].sort())
                        : String(cAns) === String(sAns)
                    );

                    const borderColor = !answered ? "var(--border)" : isCorrect ? "var(--success)" : "var(--danger)";

                    return (
                      <div key={q.questionId} style={{
                        border: `1.5px solid ${borderColor}`,
                        borderRadius: "var(--radius-sm)",
                        padding: "1.1rem",
                        background: !answered ? "var(--bg)" : isCorrect ? "rgba(34,197,94,.04)" : "rgba(239,68,68,.04)",
                      }}>
                        {/* Question header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".5rem" }}>
                          <span style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--muted)" }}>Q{i + 1} · {q.marks} mark{q.marks !== 1 ? "s" : ""}</span>
                          <span style={{
                            fontSize: ".72rem", fontWeight: 700, padding: ".2rem .6rem", borderRadius: 99,
                            background: !answered ? "#f1f5f9" : isCorrect ? "rgba(34,197,94,.15)" : "rgba(239,68,68,.15)",
                            color: !answered ? "var(--muted)" : isCorrect ? "var(--success)" : "var(--danger)",
                          }}>
                            {!answered ? "Not Answered" : isCorrect ? "✓ Correct" : "✗ Incorrect"}
                          </span>
                        </div>

                        {/* Question text */}
                        <div style={{ fontWeight: 600, marginBottom: ".85rem", lineHeight: 1.5 }}>{q.questionText}</div>

                        {/* Options */}
                        {q.options?.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: ".4rem", marginBottom: ".85rem" }}>
                            {q.options.map((opt: any, oi: number) => {
                              const optLabel = String.fromCharCode(65 + oi); // A, B, C, D
                              const optText = typeof opt === "object" ? opt.text : opt;
                              const isStudentChoice = Array.isArray(sAns) ? sAns.includes(optLabel) : String(sAns) === optLabel;
                              const isCorrectOpt = Array.isArray(cAns) ? cAns.includes(optLabel) : String(cAns) === optLabel;

                              let bg = "var(--bg)";
                              let border = "var(--border)";
                              let textColor = "var(--text)";
                              let labelBg = "#e2e8f0";
                              let labelColor = "var(--muted)";

                              if (exam.showCorrectAnswers && isCorrectOpt) {
                                bg = "rgba(34,197,94,.1)"; border = "var(--success)";
                                labelBg = "var(--success)"; labelColor = "#fff"; textColor = "var(--success)";
                              }
                              if (exam.showStudentAnswers && isStudentChoice && !isCorrectOpt) {
                                bg = "rgba(239,68,68,.08)"; border = "var(--danger)";
                                labelBg = "var(--danger)"; labelColor = "#fff"; textColor = "var(--danger)";
                              }
                              if (exam.showStudentAnswers && isStudentChoice && isCorrectOpt) {
                                bg = "rgba(34,197,94,.15)"; border = "var(--success)";
                                labelBg = "var(--success)"; labelColor = "#fff"; textColor = "var(--success)";
                              }

                              return (
                                <div key={oi} style={{
                                  display: "flex", alignItems: "flex-start", gap: ".6rem",
                                  padding: ".5rem .75rem", borderRadius: "var(--radius-sm)",
                                  border: `1px solid ${border}`, background: bg, transition: "all .15s",
                                }}>
                                  <span style={{
                                    minWidth: 24, height: 24, borderRadius: "50%",
                                    background: labelBg, color: labelColor,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: ".75rem", fontWeight: 700, flexShrink: 0,
                                  }}>{optLabel}</span>
                                  <span style={{ fontSize: ".88rem", color: textColor, fontWeight: isCorrectOpt || isStudentChoice ? 600 : 400, paddingTop: "2px" }}>
                                    {optText}
                                    {exam.showStudentAnswers && isStudentChoice && !isCorrectOpt && <span style={{ marginLeft: ".4rem", fontSize: ".75rem" }}>← your answer</span>}
                                    {exam.showCorrectAnswers && isCorrectOpt && <span style={{ marginLeft: ".4rem", fontSize: ".75rem" }}>← correct</span>}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Non-MCQ answer display */}
                        {(!q.options || q.options.length === 0) && (
                          <div style={{ display: "flex", flexDirection: "column", gap: ".35rem", marginBottom: ".75rem" }}>
                            {exam.showStudentAnswers && (
                              <div style={{ fontSize: ".85rem" }}>
                                <span style={{ color: "var(--muted)" }}>Your answer: </span>
                                <span style={{ fontWeight: 600 }}>{answered ? (Array.isArray(sAns) ? sAns.join(", ") : sAns) : "Not answered"}</span>
                              </div>
                            )}
                            {exam.showCorrectAnswers && cAns !== undefined && (
                              <div style={{ fontSize: ".85rem" }}>
                                <span style={{ color: "var(--muted)" }}>Correct answer: </span>
                                <span style={{ fontWeight: 600, color: "var(--success)" }}>{Array.isArray(cAns) ? cAns.join(", ") : cAns}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Explanation */}
                        {exam.showExplanations && q.explanation && (
                          <div style={{
                            marginTop: ".5rem", padding: ".65rem .85rem",
                            background: "rgba(99,102,241,.07)", borderRadius: "var(--radius-sm)",
                            borderLeft: "3px solid var(--primary)",
                          }}>
                            <div style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--primary)", marginBottom: ".2rem", textTransform: "uppercase", letterSpacing: ".04em" }}>Explanation</div>
                            <div style={{ fontSize: ".85rem", color: "var(--text)", lineHeight: 1.55 }}>{q.explanation}</div>
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
