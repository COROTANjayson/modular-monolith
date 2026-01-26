import { Request, Response, NextFunction } from "express";
import {
  generateCsrfToken,
  signCsrfToken,
  verifyCsrfToken,
} from "../utils/helpers";
import {
  COOKIE_SAME_SITE,
  CSRF_COOKIE_NAME,
  CSRF_SECRET,
} from "../utils/config";
import { logger } from "../libs/logger";

// ✅ Step 1: Issue token if not exists
export const csrfTokenMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies[CSRF_COOKIE_NAME];

  if (!token || !verifyCsrfToken(token, CSRF_SECRET)) {
    const newToken = generateCsrfToken();
    const signedToken = signCsrfToken(newToken, CSRF_SECRET);
    res.cookie(CSRF_COOKIE_NAME, signedToken, {
      httpOnly: false, // must be readable by frontend
      sameSite: COOKIE_SAME_SITE,
      secure: process.env.NODE_ENV === "production",
    });
  }

  next();
};

// ✅ Step 2: Verify on write requests
export const verifyCsrfMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip CSRF check for safe methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const csrfCookie = req.cookies[CSRF_COOKIE_NAME];
  logger.debug("csrfCookie", csrfCookie);
  const csrfHeader = req.headers["x-csrf-token"];

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }

  if (!verifyCsrfToken(csrfCookie, CSRF_SECRET)) {
    return res.status(403).json({ error: "Invalid CSRF token signature" });
  }

  next();
};
