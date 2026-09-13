"use client";
import { useEffect, useState } from "react";
import Nav from "../../../components/Nav";
import { api } from "../../../lib/api";
import { useAuthGuard } from "../../../lib/useAuthGuard";

type Q = {
  _id: string; questionText: string; type: string; subject: string;
  topic: string; difficulty: string; marks: number; negativeMarks: number;
  options: { key: string; text: string }[]; correctAnswer: any; explanation: string;
};

const TYPES = ["single_choice", "multiple_choice", "true_false", "numerical", "short_answer", "descriptive"];
const DIFFICULTIES = ["easy", "medium", "hard"];

const blankForm = {
  questionText: "", subject: "", topic: "", type: "single_choice",
  marks: 2, negativeMarks: 0.5, difficulty: "medium",
  options: [{ key: "A", text: "" }, { key: "B", text: "" }, { key: "C", text: "" }, { key: "D", text: "" }],
  correctAnswer: "A", explanation: "",
};

function hasOptions(type: string) {
  return ["single_choice", "multiple_choice", "true_false"].includes(type);
}
function isTrueFalse(type: string) { return type === "true_false"; }

export default function QuestionsPage() {
  useAuthGuard("admin");
  const [questions, setQuestions] = useState<Q[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>({ ...blankForm });
  const [editId, setEditId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterSubject, setFilterSubject] = useState("");
  const [filterDiff, setFilterDiff] = useState("");
  const [filterType, setFilterType] = useState("");

  const load = () => api("/questions").then(q => { setQuestions(q); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const subjects = [...new Set(questions.map(q => q.subject))];

  const filtered = questions.filter(q =>
    (!filterSubject || q.subject === filterSubject) &&
    (!filterDiff || q.difficulty === filterDiff) &&
    (!filterType || q.type === filterType)
  );

  function openAdd() {
    setForm({ ...blankForm }); setEditId(null); setShowModal(true);
  }
  function openEdit(q: Q) {
    setForm({ ...q }); setEditId(q._id); setShowModal(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const payload = {
        ...form,
        marks: Number(form.marks),
        negativeMarks: Number(form.negativeMarks),
        options: hasOptions(form.type)
          ? (isTrueFalse(form.type)
            ? [{ key: "True", text: "True" }, { key: "False", text: "False" }]
            : form.options.filter((o: any) => o.text.trim()))
          : [],
      };
      if (editId) {
        await api(`/questions/${editId}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await api("/questions", { method: "POST", body: JSON.stringify(payload) });
      }
      setShowModal(false); load();
    } catch (err: any) { alert(err.message); }
    setSaving(false);
  }

  async function del(id: string) {
    if (!confirm("Delete this question? It will be removed from any exams.")) return;
    await api(`/questions/${id}`, { method: "DELETE" });
    load();
  }

  const DIFF_BADGE: Record<string, string> = { easy: "badge-success", medium: "badge-warning", hard: "badge-danger" };
  const TYPE_LABEL: Record<string, string> = {
    single_choice: "Single MCQ", multiple_choice: "Multi MCQ",
    true_false: "True/False", numerical: "Numerical",
    short_answer: "Short Answer", descriptive: "Descriptive",
  };

  return (
    <>
      <Nav role="admin" />
      <main className="page">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 className="section-title">Question Bank</h1>
            <p className="section-sub">{questions.length} question{questions.length !== 1 ? "s" : ""} total</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Question</button>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: ".75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <select className="input" style={{ width: "auto" }} value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="input" style={{ width: "auto" }} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {TYPES.map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
          <select className="input" style={{ width: "auto" }} value={filterDiff} onChange={e => setFilterDiff(e.target.value)}>
            <option value="">All Difficulties</option>
            {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
          </select>
          {(filterSubject || filterType || filterDiff) &&
            <button className="btn btn-ghost" onClick={() => { setFilterSubject(""); setFilterType(""); setFilterDiff(""); }}>Clear filters</button>
          }
        </div>

        <div className="card">
          <div className="table-wrap">
            {loading ? (
              <div className="empty-state">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: "2rem", marginBottom: ".5rem" }}>❓</div>
                <div style={{ fontWeight: 600 }}>No questions yet</div>
                <div>Add questions to build your bank.</div>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr><th style={{ width: "40%" }}>Question</th><th>Subject</th><th>Type</th><th>Difficulty</th><th>Marks</th><th></th></tr>
                </thead>
                <tbody>
                  {filtered.map(q => (
                    <tr key={q._id}>
                      <td style={{ maxWidth: 350 }}>
                        <div style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{q.questionText}</div>
                        {q.topic && <div style={{ fontSize: ".78rem", color: "var(--muted)", marginTop: ".15rem" }}>{q.topic}</div>}
                      </td>
                      <td style={{ fontSize: ".85rem" }}>{q.subject}</td>
                      <td><span className="badge badge-navy">{TYPE_LABEL[q.type]}</span></td>
                      <td><span className={`badge ${DIFF_BADGE[q.difficulty] ?? "badge-muted"}`}>{q.difficulty}</span></td>
                      <td>{q.marks}{q.negativeMarks > 0 && <span style={{ color: "var(--danger)", fontSize: ".8rem" }}> (-{q.negativeMarks})</span>}</td>
                      <td>
                        <div style={{ display: "flex", gap: ".5rem" }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(q)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => del(q._id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal modal-lg">
            <div className="card-header" style={{ borderRadius: "14px 14px 0 0" }}>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--navy)" }}>{editId ? "Edit Question" : "Add Question"}</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={save} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Question Text */}
              <div>
                <label className="input-label">Question Text *</label>
                <textarea className="input" required rows={3} value={form.questionText}
                  onChange={e => setForm((f: any) => ({ ...f, questionText: e.target.value }))} />
              </div>

              {/* Row: subject, topic, type */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div>
                  <label className="input-label">Subject *</label>
                  <input className="input" required value={form.subject}
                    onChange={e => setForm((f: any) => ({ ...f, subject: e.target.value }))} />
                </div>
                <div>
                  <label className="input-label">Topic</label>
                  <input className="input" value={form.topic}
                    onChange={e => setForm((f: any) => ({ ...f, topic: e.target.value }))} />
                </div>
                <div>
                  <label className="input-label">Type *</label>
                  <select className="input" value={form.type}
                    onChange={e => setForm((f: any) => ({ ...f, type: e.target.value, correctAnswer: "" }))}>
                    {TYPES.map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                  </select>
                </div>
              </div>

              {/* Row: marks, negative, difficulty */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div>
                  <label className="input-label">Marks *</label>
                  <input className="input" type="number" min={0} step={0.5} value={form.marks}
                    onChange={e => setForm((f: any) => ({ ...f, marks: e.target.value }))} />
                </div>
                <div>
                  <label className="input-label">Negative Marks</label>
                  <input className="input" type="number" min={0} step={0.25} value={form.negativeMarks}
                    onChange={e => setForm((f: any) => ({ ...f, negativeMarks: e.target.value }))} />
                </div>
                <div>
                  <label className="input-label">Difficulty</label>
                  <select className="input" value={form.difficulty}
                    onChange={e => setForm((f: any) => ({ ...f, difficulty: e.target.value }))}>
                    {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Options — only for MCQ */}
              {hasOptions(form.type) && !isTrueFalse(form.type) && (
                <div>
                  <label className="input-label">Options</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
                    {form.options.map((o: any, i: number) => (
                      <div key={o.key} style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                        <span style={{ width: 24, fontWeight: 700, color: "var(--navy)", flexShrink: 0 }}>{o.key}</span>
                        <input className="input" placeholder={`Option ${o.key}`} value={o.text}
                          onChange={e => setForm((f: any) => ({
                            ...f,
                            options: f.options.map((x: any) => x.key === o.key ? { ...x, text: e.target.value } : x)
                          }))} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Correct Answer */}
              {!isTrueFalse(form.type) && (
                <div>
                  <label className="input-label">Correct Answer {form.type === "multiple_choice" ? "(comma separated keys, e.g. A,C)" : ""}</label>
                  {form.type === "single_choice" ? (
                    <select className="input" style={{ maxWidth: 200 }} value={form.correctAnswer}
                      onChange={e => setForm((f: any) => ({ ...f, correctAnswer: e.target.value }))}>
                      {form.options.map((o: any) => <option key={o.key} value={o.key}>{o.key} — {o.text}</option>)}
                    </select>
                  ) : (
                    <input className="input" value={typeof form.correctAnswer === "object" ? form.correctAnswer?.join?.(",") ?? "" : form.correctAnswer}
                      onChange={e => {
                        const v = e.target.value;
                        const val = form.type === "multiple_choice" ? v.split(",").map((x: string) => x.trim()).filter(Boolean) : v;
                        setForm((f: any) => ({ ...f, correctAnswer: val }));
                      }} />
                  )}
                </div>
              )}
              {isTrueFalse(form.type) && (
                <div>
                  <label className="input-label">Correct Answer</label>
                  <select className="input" style={{ maxWidth: 200 }} value={form.correctAnswer}
                    onChange={e => setForm((f: any) => ({ ...f, correctAnswer: e.target.value }))}>
                    <option value="True">True</option>
                    <option value="False">False</option>
                  </select>
                </div>
              )}

              {/* Explanation */}
              <div>
                <label className="input-label">Explanation (optional)</label>
                <textarea className="input" rows={2} value={form.explanation}
                  onChange={e => setForm((f: any) => ({ ...f, explanation: e.target.value }))} />
              </div>

              <div style={{ display: "flex", gap: ".75rem", justifyContent: "flex-end" }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving…" : editId ? "Update Question" : "Add Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
