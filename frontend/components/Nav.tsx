"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "../lib/api";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/questions", label: "Questions" },
  { href: "/admin/results", label: "Results" },
  { href: "/admin/integrity", label: "Integrity" },
];

const studentLinks = [
  { href: "/student", label: "Dashboard" },
];

export default function Nav({ role }: { role: "admin" | "student" }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("exam_user");
      if (raw) setUser(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);
  const links = role === "admin" ? adminLinks : studentLinks;

  const isActive = (href: string) =>
    href === "/admin" || href === "/student"
      ? pathname === href
      : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40" style={{ background: "var(--navy)", boxShadow: "0 2px 8px rgb(0 0 0/.25)" }}>
      <div className="page" style={{ padding: "0 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px" }}>
          {/* Logo */}
          <Link href={role === "admin" ? "/admin" : "/student"}
            style={{ display: "flex", alignItems: "center", gap: ".6rem", textDecoration: "none" }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "rgba(255,255,255,.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, color: "#fff", fontSize: ".9rem"
            }}>EP</div>
            <span style={{ fontWeight: 700, color: "#fff", fontSize: ".95rem", letterSpacing: ".02em" }}>
              Exam Portal
            </span>
          </Link>

          {/* Nav Links */}
          <nav style={{ display: "flex", gap: ".25rem" }}>
            {links.map(l => (
              <Link key={l.href} href={l.href} style={{
                padding: ".4rem .85rem",
                borderRadius: 6,
                fontSize: ".85rem",
                fontWeight: 600,
                color: isActive(l.href) ? "#fff" : "rgba(255,255,255,.65)",
                background: isActive(l.href) ? "rgba(255,255,255,.16)" : "transparent",
                textDecoration: "none",
                transition: "background .15s, color .15s",
              }}>
                {l.label}
              </Link>
            ))}
          </nav>

          {/* User chip + logout */}
          <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: ".5rem",
              background: "rgba(255,255,255,.12)", borderRadius: 99,
              padding: ".3rem .75rem .3rem .4rem",
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: "rgba(255,255,255,.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: ".7rem", fontWeight: 700, color: "#fff"
              }}>
                {user?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <span style={{ fontSize: ".82rem", fontWeight: 600, color: "#fff", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.name || role}
              </span>
            </div>
            <button
              onClick={() => { logout(); router.push("/login"); }}
              style={{
                padding: ".35rem .85rem", borderRadius: 6,
                border: "1.5px solid rgba(255,255,255,.3)",
                background: "transparent", color: "rgba(255,255,255,.85)",
                fontSize: ".8rem", fontWeight: 600, cursor: "pointer",
                transition: "background .15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,.12)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
