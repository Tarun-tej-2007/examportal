"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Nav from "../../../../components/Nav";
import { api } from "../../../../lib/api";
import { useAuthGuard } from "../../../../lib/useAuthGuard";

function fmt(d: string) {
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ExamInstructions() {
  useAuthGuard("student");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [exam, setExam] = useState<any>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    api(`/exams/student/${id}`).then(setExam).catch(e => alert(e.message));
  }, [id]);

  async function start() {
    setStarting(true);
    try {
      const a = await api(`/attempts/start/${id}`, { method: "POST" });
      router.push(`/student/attempt/${a._id}`);
    } catch (e: any) { alert(e.message); setStarting(false); }
  }

  if (!exam) return (
    <>
      <Nav role="student" />
      <div className="empty-state" style={{ marginTop: "4rem" }}>Loading exam…</div>
    </>
  );

  const now = Date.now();
  const canStart = now >= new Date(exam.startTime).getTime() && now <= new Date(exam.endTime).getTime();

  return (
    <>
      <Nav role="student" />
      <main className="page-sm">
        <div className="card" style={{ marginTop: "1rem" }}>
          {/* Header */}
          <div style={{
            background: "var(--navy)", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
            padding: "2rem 2rem 1.75rem",
          }}>
            <div className="badge" style={{ background: "rgba(255,255,255,.18)", color: "#fff", marginBottom: ".75rem" }}>
              {exam.subject}
            </div>
            <h1 style={{ color: "#fff", fontWeight: 800, fontSize: "1.6rem", margin: 0 }}>{exam.title}</h1>
            {exam.description && (
              <p style={{ color: "rgba(255,255,255,.7)", marginTop: ".6rem", fontSize: ".9rem" }}>{exam.description}</p>
            )}
          </div>

          <div className="card-body">
            {/* Exam meta */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              {[
                ["⏱ Duration", `${exam.durationMinutes} minutes`],
                ["📝 Total Marks", exam.totalMarks],
                ["✅ Passing Marks", exam.passingMarks],
                ["📅 Start", fmt(exam.startTime)],
                ["📅 End", fmt(exam.endTime)],
                ["🔒 Negative Marking", exam.negativeMarking ? `Yes (${exam.defaultNegativeMarks} per wrong)` : "No"],
              ].map(([k, v]) => (
                <div key={String(k)} style={{ background: "var(--bg)", borderRadius: "var(--radius-sm)", padding: ".85rem" }}>
                  <div style={{ fontSize: ".75rem", fontWeight: 600, color: "var(--muted)", marginBottom: ".25rem" }}>{k}</div>
                  <div style={{ fontWeight: 700, fontSize: ".9rem" }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Instructions */}
            {exam.instructions?.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: ".65rem" }}>Instructions</div>
                <ul style={{ paddingLeft: "1.25rem", margin: 0, display: "flex", flexDirection: "column", gap: ".45rem" }}>
                  {exam.instructions.map((ins: string, i: number) => (
                    <li key={i} style={{ fontSize: ".875rem", color: "var(--text-2)" }}>{ins}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Security warning */}
            <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>
              <strong>⚠ Strict Examination Mode:</strong> Switching tabs, minimising the browser, or exiting fullscreen will
              {exam.security?.autoSubmitOnViolation ? " automatically submit your exam." : " be recorded as a violation."}
              Ensure a stable internet connection and device before starting.
            </div>

            {!canStart && (
              <div className="alert alert-warning" style={{ marginBottom: "1.25rem" }}>
                This exam is not currently available.
                {Date.now() < new Date(exam.startTime).getTime()
                  ? ` It starts on ${fmt(exam.startTime)}.`
                  : " It has already ended."}
              </div>
            )}

            <div style={{ display: "flex", gap: "1rem" }}>
              <button className="btn btn-outline" onClick={() => router.push("/student")}>← Back</button>
              <button
                className="btn btn-primary btn-lg"
                onClick={start}
                disabled={!canStart || starting}
                style={{ flex: 1 }}
              >
                {starting ? "Starting…" : "Start Examination →"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
