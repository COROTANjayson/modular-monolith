import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ACCESS_SECRET } from "../shared/utils/config";

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

  console.log("AuthMiddleware Debug:", { 
    cookies: req.cookies, 
    authHeader, 
    tokenFound: !!token 
  });

  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const payload: any = jwt.verify(token, ACCESS_SECRET);
    (req as any).userId = payload.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
