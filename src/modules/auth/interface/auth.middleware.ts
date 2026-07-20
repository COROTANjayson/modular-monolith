/**
 * Interface Layer - Auth Middleware
 * HTTP middleware for authentication
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ACCESS_SECRET } from "../../../shared/utils/config";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  
  let token = req.cookies?.accessToken;
  if (!token && authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    if (typeof payload === "string" || typeof payload.id !== "string") {
      return res.status(401).json({ error: "Invalid token" });
    }
    req.userId = payload.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
