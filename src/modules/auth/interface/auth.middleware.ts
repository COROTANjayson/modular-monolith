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
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }

  const token = auth.slice(7);
  try {
    const payload: any = jwt.verify(token, ACCESS_SECRET);
    (req as any).userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
