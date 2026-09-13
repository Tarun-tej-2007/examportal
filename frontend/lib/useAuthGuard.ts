"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuthGuard(requiredRole: "admin" | "student") {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem("exam_token");
    const userRaw = localStorage.getItem("exam_user");
    if (!token || !userRaw) {
      router.replace("/login");
      return;
    }
    try {
      const user = JSON.parse(userRaw);
      if (user.role !== requiredRole) {
        router.replace(user.role === "admin" ? "/admin" : "/student");
      }
    } catch {
      router.replace("/login");
    }
  }, [requiredRole, router]);
}
