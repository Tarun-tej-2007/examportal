import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

export interface AuthRequest extends Request {
  user?: { id: string; role: "admin" | "student" };
}

export function auth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ message: "Authentication required" });
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, config.jwtSecret) as { id: string; role: "admin" | "student" };
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireRole(role: "admin" | "student") {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}
