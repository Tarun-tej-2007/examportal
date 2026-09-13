"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, saveSession } from "../../lib/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect already-logged-in users
  useEffect(() => {
    try {
      const token = localStorage.getItem("exam_token");
      const user = JSON.parse(localStorage.getItem("exam_user") || "null");
      if (token && user?.role) {
        router.replace(user.role === "admin" ? "/admin" : "/student");
      }
    } catch { /* ignore */ }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const data = await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      saveSession(data);
      router.push(data.user.role === "admin" ? "/admin" : "/student");
    } catch (err: any) { setError(err.message); }
    setLoading(false);
  }

  return (
    <main style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #0d2644 0%, #12345b 50%, #1a4a80 100%)",
      padding: "1.5rem", fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {/* Decorative blobs */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", right: "-10%", width: 500, height: 500, borderRadius: "50%", background: "rgba(37,99,235,.15)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "-10%", width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,.06)", filter: "blur(60px)" }} />
      </div>

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: "0 auto .9rem",
            background: "rgba(255,255,255,.15)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1.5px solid rgba(255,255,255,.25)",
            fontSize: "1.4rem", fontWeight: 900, color: "#fff",
          }}>EP</div>
          <div style={{ fontSize: ".8rem", fontWeight: 700, letterSpacing: ".15em", color: "rgba(255,255,255,.55)", textTransform: "uppercase" }}>College</div>
          <h1 style={{ color: "#fff", fontWeight: 800, fontSize: "1.6rem", margin: ".3rem 0 0" }}>Online Examination Portal</h1>
          <p style={{ color: "rgba(255,255,255,.55)", fontSize: ".85rem", marginTop: ".35rem" }}>Authorized users only</p>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,.97)", borderRadius: 16,
          padding: "2rem", boxShadow: "0 25px 60px rgb(0 0 0/.35)",
          border: "1px solid rgba(255,255,255,.5)",
        }}>
          {error && (
            <div style={{
              marginBottom: "1.25rem", padding: ".75rem 1rem",
              background: "#fef2f2", border: "1px solid #fca5a5",
              borderRadius: 8, fontSize: ".875rem", color: "#dc2626",
              display: "flex", alignItems: "center", gap: ".5rem",
            }}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: ".78rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: ".4rem" }}>
                Email Address
              </label>
              <input
                type="email" required autoComplete="email" autoFocus
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@college.edu"
                style={{
                  width: "100%", padding: ".65rem .9rem", borderRadius: 8,
                  border: "1.5px solid #e2e8f0", fontSize: ".9rem",
                  outline: "none", transition: "border-color .15s, box-shadow .15s",
                  boxSizing: "border-box",
                }}
                onFocus={e => { e.target.style.borderColor = "#12345b"; e.target.style.boxShadow = "0 0 0 3px rgba(18,52,91,.1)"; }}
                onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: ".78rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: ".4rem" }}>
                Password
              </label>
              <input
                type="password" required autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%", padding: ".65rem .9rem", borderRadius: 8,
                  border: "1.5px solid #e2e8f0", fontSize: ".9rem",
                  outline: "none", transition: "border-color .15s, box-shadow .15s",
                  boxSizing: "border-box",
                }}
                onFocus={e => { e.target.style.borderColor = "#12345b"; e.target.style.boxShadow = "0 0 0 3px rgba(18,52,91,.1)"; }}
                onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            <button
              type="submit" disabled={loading}
              style={{
                marginTop: ".25rem",
                width: "100%", padding: ".8rem",
                background: loading ? "#94a3b8" : "#12345b",
                color: "#fff", fontWeight: 700, fontSize: ".95rem",
                border: "none", borderRadius: 9, cursor: loading ? "not-allowed" : "pointer",
                transition: "background .15s, transform .1s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem",
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#0d2644"; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#12345b"; }}
            >
              {loading ? (
                <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> Signing in…</>
              ) : "Sign In →"}
            </button>
          </form>

          <div style={{ marginTop: "1.25rem", padding: ".85rem", background: "#f8fafc", borderRadius: 8, fontSize: ".8rem", color: "#64748b", textAlign: "center" }}>
            Students: login with your email · Password is your register number by default
          </div>
        </div>

        <p style={{ textAlign: "center", color: "rgba(255,255,255,.35)", fontSize: ".78rem", marginTop: "1.5rem" }}>
          © {new Date().getFullYear()} College Examination Portal
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
