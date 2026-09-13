"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../../../lib/api";
import { useAuthGuard } from "../../../../lib/useAuthGuard";

export default function AttemptPage() {
  useAuthGuard("student");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [attempt, setAttempt] = useState<any>(null);
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const violationLock = useRef(false);
  const saveTimer = useRef<any>(null);

  // Auto-submit on violation
  const autoSubmit = async (type: string) => {
    if (violationLock.current || submitted) return;
    violationLock.current = true;
    try {
      await api(`/attempts/${id}/violation`, {
        method: "POST",
        body: JSON.stringify({ type, details: "Security violation detected by browser." }),
      });
    } catch { /* ignore */ }
    setSubmitted(true);
    alert("⚠ Your examination has been automatically submitted due to a security violation.");
    router.replace("/student");
  };

  // Load attempt
  useEffect(() => {
    api(`/attempts/${id}`)
      .then((a: any) => {
        setAttempt(a);
        setTimeLeft(Math.max(0, Math.floor((new Date(a.serverDeadline).getTime() - Date.now()) / 1000)));
      })
      .catch(e => { alert(e.message); router.replace("/student"); });
  }, [id]);

  // Proctoring + timer
  useEffect(() => {
    if (!attempt) return;
    const security = attempt.examId?.security ?? {};

    const onVis = () => {
      if (document.visibilityState === "hidden" && security.detectTabSwitch !== false)
        autoSubmit("TAB_SWITCH");
    };
    const onBlur = () => {
      if (security.detectWindowBlur !== false) autoSubmit("WINDOW_BLUR");
    };
    const onFs = () => {
      if (security.detectFullscreenExit !== false && !document.fullscreenElement)
        autoSubmit("FULLSCREEN_EXIT");
    };

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFs);

    if (security.requireFullscreen !== false && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => { });
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(attempt.serverDeadline).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0 && !violationLock.current && !submitted) {
        autoSubmit("OTHER");
      }
    }, 1000);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFs);
      clearInterval(interval);
    };
  }, [attempt]);

  // Answer helpers
  const currentQ = attempt?.questionSnapshot?.[index];
  const getAnswer = (qid: string) =>
    attempt?.answers?.find((a: any) => String(a.questionId) === String(qid));

  async function saveAnswer(qid: string, value: any, review?: boolean) {
    if (!attempt) return;
    const updated = { ...attempt };
    const answers = [...(updated.answers || [])];
    const idx = answers.findIndex(a => String(a.questionId) === String(qid));
    const entry = { questionId: qid, selectedAnswer: value, markedForReview: review ?? false, answeredAt: new Date() };
    if (idx >= 0) answers[idx] = entry; else answers.push(entry);
    updated.answers = answers;
    setAttempt(updated);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api(`/attempts/${id}/answer`, {
        method: "PATCH",
        body: JSON.stringify({ questionId: qid, selectedAnswer: value, markedForReview: review ?? false }),
      }).catch(() => { });
    }, 300);
  }

  function toggleReview() {
    if (!currentQ) return;
    const ans = getAnswer(String(currentQ.questionId));
    saveAnswer(String(currentQ.questionId), ans?.selectedAnswer, !(ans?.markedForReview ?? false));
  }

  async function submitExam() {
    if (submitted) return;
    if (!confirm("Submit the examination? You cannot change answers after submission.")) return;
    try {
      const result = await api(`/attempts/${id}/submit`, { method: "POST" });
      setSubmitted(true);
      if (document.exitFullscreen) document.exitFullscreen().catch(() => { });
      router.replace(`/student/results/${result._id}`);
    } catch (e: any) { alert(e.message); }
  }

  if (!attempt || !currentQ) return (
    <main style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ textAlign: "center", color: "var(--muted)" }}>
        <div style={{ fontSize: "1.5rem", marginBottom: ".5rem" }}>⏳</div>
        Loading examination…
      </div>
    </main>
  );

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const timerClass = timeLeft < 60 ? "danger" : timeLeft < 300 ? "warning" : "";

  const selectedAnswer = getAnswer(String(currentQ.questionId))?.selectedAnswer;
  const isReview = getAnswer(String(currentQ.questionId))?.markedForReview ?? false;
  const totalQ = attempt.questionSnapshot.length;

  // Palette state per question
  function qState(q: any, i: number) {
    if (i === index) return "current";
    const ans = getAnswer(String(q.questionId));
    if (!ans) return "unanswered";
    if (ans.markedForReview) return "review";
    if (ans.selectedAnswer !== undefined && ans.selectedAnswer !== null && ans.selectedAnswer !== "") return "answered";
    return "unanswered";
  }

  const answeredCount = attempt.questionSnapshot.filter((q: any) => {
    const a = getAnswer(String(q.questionId));
    return a?.selectedAnswer !== undefined && a?.selectedAnswer !== null && a?.selectedAnswer !== "";
  }).length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{
        background: "var(--navy)", color: "#fff", padding: "0 1.5rem",
        height: 58, display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 40, boxShadow: "0 2px 8px rgb(0 0 0/.25)",
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: ".95rem" }}>{attempt.examId?.title ?? "Examination"}</div>
          <div style={{ fontSize: ".75rem", opacity: .75 }}>Q {index + 1} of {totalQ} · {answeredCount} answered</div>
        </div>
        <div style={{
          fontFamily: "monospace", fontSize: "1.25rem", fontWeight: 700,
          padding: ".3rem .9rem", borderRadius: "var(--radius-sm)",
          border: "1.5px solid rgba(255,255,255,.3)",
          background: timerClass === "danger" ? "#dc2626" : timerClass === "warning" ? "#d97706" : "rgba(255,255,255,.12)",
          transition: "background .5s",
          animation: timerClass === "danger" ? "pulse 1s infinite" : "none",
        }}>
          {mm}:{ss}
        </div>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 280px", gap: "1.25rem", padding: "1.25rem 1.5rem", maxWidth: 1280, width: "100%", margin: "0 auto" }}>

        {/* Question Panel */}
        <div className="card card-body" style={{ alignSelf: "start" }}>
          <div style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: ".75rem" }}>
            Question {index + 1}
            {isReview && <span className="badge badge-warning" style={{ marginLeft: ".6rem" }}>Marked for Review</span>}
          </div>
          <div style={{ fontSize: "1.05rem", fontWeight: 600, lineHeight: 1.7, marginBottom: "1.5rem" }}>
            {currentQ.questionText}
          </div>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
            {(currentQ.type === "single_choice" || currentQ.type === "true_false") &&
              (currentQ.options || []).map((o: any) => (
                <label key={o.key} className={`exam-option ${selectedAnswer === o.key ? "selected" : ""}`}>
                  <input type="radio" name={`q-${currentQ.questionId}`}
                    checked={selectedAnswer === o.key}
                    onChange={() => saveAnswer(String(currentQ.questionId), o.key, isReview)} />
                  <span style={{ fontWeight: 500 }}><strong style={{ color: "var(--navy)", marginRight: ".35rem" }}>{o.key}.</strong>{o.text}</span>
                </label>
              ))
            }
            {currentQ.type === "multiple_choice" &&
              (currentQ.options || []).map((o: any) => {
                const vals = Array.isArray(selectedAnswer) ? selectedAnswer : [];
                return (
                  <label key={o.key} className={`exam-option ${vals.includes(o.key) ? "selected" : ""}`}>
                    <input type="checkbox" checked={vals.includes(o.key)}
                      onChange={e => {
                        const next = e.target.checked ? [...vals, o.key] : vals.filter((v: string) => v !== o.key);
                        saveAnswer(String(currentQ.questionId), next, isReview);
                      }} />
                    <span style={{ fontWeight: 500 }}><strong style={{ color: "var(--navy)", marginRight: ".35rem" }}>{o.key}.</strong>{o.text}</span>
                  </label>
                );
              })
            }
            {(currentQ.type === "numerical" || currentQ.type === "short_answer") && (
              <input className="input" style={{ maxWidth: 320 }}
                placeholder={currentQ.type === "numerical" ? "Enter your numerical answer…" : "Enter your answer…"}
                value={selectedAnswer ?? ""}
                onChange={e => saveAnswer(String(currentQ.questionId), e.target.value, isReview)} />
            )}
            {currentQ.type === "descriptive" && (
              <textarea className="input" rows={5} placeholder="Enter your detailed answer…"
                value={selectedAnswer ?? ""}
                onChange={e => saveAnswer(String(currentQ.questionId), e.target.value, isReview)} />
            )}
          </div>

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem", flexWrap: "wrap", gap: ".75rem" }}>
            <button className="btn btn-outline" disabled={index === 0} onClick={() => setIndex(i => Math.max(0, i - 1))}>
              ← Previous
            </button>
            <button className={`btn ${isReview ? "btn-outline" : "btn-ghost"}`}
              style={{ borderColor: isReview ? "var(--warning)" : undefined, color: isReview ? "var(--warning)" : undefined }}
              onClick={toggleReview}>
              {isReview ? "★ Marked for Review" : "☆ Mark for Review"}
            </button>
            <button className="btn btn-primary" disabled={index === totalQ - 1} onClick={() => setIndex(i => Math.min(totalQ - 1, i + 1))}>
              Next →
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="card card-body">
            <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: ".75rem" }}>Question Palette</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: ".4rem" }}>
              {attempt.questionSnapshot.map((q: any, i: number) => (
                <button key={q.questionId} className={`q-btn ${qState(q, i)}`}
                  onClick={() => setIndex(i)} title={`Question ${i + 1}`}>
                  {i + 1}
                </button>
              ))}
            </div>
            {/* Legend */}
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: ".3rem" }}>
              {[["answered", "Answered"], ["review", "Marked for Review"], ["unanswered", "Not Answered"]].map(([cls, lbl]) => (
                <div key={cls} style={{ display: "flex", alignItems: "center", gap: ".5rem", fontSize: ".78rem", color: "var(--muted)" }}>
                  <span className={`q-btn ${cls}`} style={{ width: 16, height: 16, fontSize: ".6rem", minWidth: 16 }}></span>
                  {lbl}
                </div>
              ))}
            </div>
          </div>

          <div className="card card-body">
            <div style={{ fontSize: ".8rem", color: "var(--muted)", marginBottom: ".6rem" }}>
              {answeredCount} of {totalQ} answered
            </div>
            <div style={{
              height: 6, background: "var(--border)", borderRadius: 99, overflow: "hidden", marginBottom: "1rem",
            }}>
              <div style={{ width: `${(answeredCount / totalQ) * 100}%`, height: "100%", background: "var(--success)", borderRadius: 99, transition: "width .3s" }} />
            </div>
            <button className="btn btn-danger" style={{ width: "100%" }} onClick={submitExam} disabled={submitted}>
              {submitted ? "Submitted" : "Submit Exam"}
            </button>
            <div style={{ fontSize: ".75rem", color: "var(--muted)", textAlign: "center", marginTop: ".5rem" }}>
              Cannot be undone
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
