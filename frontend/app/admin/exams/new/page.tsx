"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "../../../../components/Nav";
import { api } from "../../../../lib/api";
import { useAuthGuard } from "../../../../lib/useAuthGuard";

const defaultInstructions = [
  "Read each question carefully before answering.",
  "Leaving the exam window may result in automatic submission.",
  "Do not refresh the page during the examination.",
  "Ensure a stable internet connection before starting.",
];

export default function NewExam() {
  useAuthGuard("admin");
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    title: "", subject: "", description: "",
    durationMinutes: 60, totalMarks: 100, passingMarks: 40,
    startTime: "", endTime: "",
    negativeMarking: true, defaultNegativeMarks: 0.25,
    resultMode: "immediate",
    showScore: true, showPassFail: true,
    showCorrectAnswers: false, showStudentAnswers: false, showExplanations: false,
    instructions: [...defaultInstructions],
    security: {
      requireFullscreen: true, detectTabSwitch: true,
      detectWindowBlur: true, detectFullscreenExit: true,
      autoSubmitOnViolation: true, preventMultipleSessions: true,
    },
  });
  const [newInstruction, setNewInstruction] = useState("");

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const setSec = (k: string, v: boolean) => setForm((f: any) => ({ ...f, security: { ...f.security, [k]: v } }));

  function addInstruction() {
    if (!newInstruction.trim()) return;
    set("instructions", [...form.instructions, newInstruction.trim()]);
    setNewInstruction("");
  }
  function removeInstruction(i: number) {
    set("instructions", form.instructions.filter((_: any, idx: number) => idx !== i));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const payload = {
        ...form,
        durationMinutes: Number(form.durationMinutes),
        totalMarks: Number(form.totalMarks),
        passingMarks: Number(form.passingMarks),
        defaultNegativeMarks: Number(form.defaultNegativeMarks),
        // Convert local IST datetime-local values → proper UTC ISO strings
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        questionIds: [],
      };
      const exam = await api("/exams", { method: "POST", body: JSON.stringify(payload) });
      router.push(`/admin/exams/${exam._id}`);
    } catch (err: any) { alert(err.message); setSaving(false); }
  }

  return (
    <>
      <Nav role="admin" />
      <main className="page-sm">
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 className="section-title">Create Examination</h1>
          <p className="section-sub">After creating, you can add questions and assign students from the exam management page.</p>
        </div>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Basic Info */}
          <div className="card card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: ".25rem" }}>Basic Information</div>
            <div>
              <label className="input-label">Exam Title *</label>
              <input className="input" required value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Mid-Semester Mathematics Exam" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="input-label">Subject *</label>
                <input className="input" required value={form.subject} onChange={e => set("subject", e.target.value)} placeholder="e.g. Mathematics" />
              </div>
              <div>
                <label className="input-label">Duration (minutes) *</label>
                <input className="input" type="number" required min={1} value={form.durationMinutes} onChange={e => set("durationMinutes", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="input-label">Description</label>
              <textarea className="input" rows={2} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Optional exam description" />
            </div>
          </div>

          {/* Marks */}
          <div className="card card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: ".25rem" }}>Marks & Scoring</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="input-label">Total Marks</label>
                <input className="input" type="number" min={0} value={form.totalMarks} onChange={e => set("totalMarks", e.target.value)} />
                <div style={{ fontSize: ".75rem", color: "var(--muted)", marginTop: ".25rem" }}>Auto-updated when questions are added</div>
              </div>
              <div>
                <label className="input-label">Passing Marks</label>
                <input className="input" type="number" min={0} value={form.passingMarks} onChange={e => set("passingMarks", e.target.value)} />
              </div>
              <div>
                <label className="input-label">Default –ve Marks</label>
                <input className="input" type="number" min={0} step={0.25} value={form.defaultNegativeMarks} onChange={e => set("defaultNegativeMarks", e.target.value)} disabled={!form.negativeMarking} />
              </div>
            </div>
            <label className="check-row">
              <input type="checkbox" checked={form.negativeMarking} onChange={e => set("negativeMarking", e.target.checked)} />
              Enable negative marking
            </label>
          </div>

          {/* Schedule */}
          <div className="card card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: ".25rem" }}>Schedule</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="input-label">Start Time *</label>
                <input className="input" type="datetime-local" required value={form.startTime} onChange={e => set("startTime", e.target.value)} />
              </div>
              <div>
                <label className="input-label">End Time *</label>
                <input className="input" type="datetime-local" required value={form.endTime} onChange={e => set("endTime", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="card card-body" style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
            <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: ".25rem" }}>Result Visibility</div>
            <div style={{ maxWidth: 260 }}>
              <label className="input-label">Result Release Mode</label>
              <select className="input" value={form.resultMode} onChange={e => set("resultMode", e.target.value)}>
                <option value="immediate">Immediate (on submit)</option>
                <option value="manual">Manual (admin releases)</option>
                <option value="scheduled">Scheduled (at specific time)</option>
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: ".5rem", marginTop: ".25rem" }}>
              {[
                ["showScore", "Show Score"], ["showPassFail", "Show Pass/Fail"],
                ["showCorrectAnswers", "Show Correct Answers"],
                ["showStudentAnswers", "Show Student Answers"], ["showExplanations", "Show Explanations"],
              ].map(([k, l]) => (
                <label key={k} className="check-row">
                  <input type="checkbox" checked={form[k as string]} onChange={e => set(k as string, e.target.checked)} />
                  {l}
                </label>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="card card-body" style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
            <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: ".25rem" }}>Security & Proctoring</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".5rem" }}>
              {([
                ["requireFullscreen", "Require fullscreen"],
                ["detectTabSwitch", "Detect tab switch"],
                ["detectWindowBlur", "Detect window blur"],
                ["detectFullscreenExit", "Detect fullscreen exit"],
                ["autoSubmitOnViolation", "Auto-submit on violation"],
                ["preventMultipleSessions", "Prevent multiple sessions"],
              ] as [string, string][]).map(([k, l]) => (
                <label key={k} className="check-row">
                  <input type="checkbox" checked={form.security[k]} onChange={e => setSec(k, e.target.checked)} />
                  {l}
                </label>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="card card-body" style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
            <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: ".25rem" }}>Instructions</div>
            {form.instructions.map((ins: string, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                <span style={{ flex: 1, fontSize: ".875rem", color: "var(--text-2)" }}>• {ins}</span>
                <button type="button" className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => removeInstruction(i)}>✕</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: ".5rem" }}>
              <input className="input" placeholder="Add instruction…" value={newInstruction}
                onChange={e => setNewInstruction(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addInstruction())} />
              <button type="button" className="btn btn-outline" onClick={addInstruction}>Add</button>
            </div>
          </div>

          <div className="alert alert-info" style={{ fontSize: ".85rem" }}>
            After creation, go to the exam management page to add questions and assign students to the Exam Space.
          </div>

          <div style={{ display: "flex", gap: ".75rem", justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-outline" onClick={() => router.push("/admin")}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              {saving ? "Creating…" : "Create Exam & Space →"}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
