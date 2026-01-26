import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../utils/response.util";
import AuthService from "./auth.services";
import { AppError } from "../../utils/app-error";
import { loginSchema, registerSchema } from "./auth.types";
import { validation } from "../../utils/validate";
import { generateCsrfToken } from "../../utils/helpers";
import {
  COOKIE_DOMAIN,
  COOKIE_SAME_SITE,
  COOKIE_SECURE,
  CSRF_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "../../utils/config";
import { logger } from "../../libs/logger";

export class AuthController {
  private authSvc = new AuthService();

  async resendVerification(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const result = await this.authSvc.resendVerification(email);
      logger.info("Verification email resent:", { email });
      return successResponse(res, result, 200, "Verification email sent");
    } catch (err: any) {
      logger.error("Resend verification failed:", {
        error: err.message,
        email: req.body.email,
      });
      return errorResponse(res, err.statusCode || 500, err.message);
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.body; // or req.body depending on how we want to implement it, usually query param from link
      if (!token) throw new Error("Token missing");

      const result = await this.authSvc.verifyEmail(token as string);
      logger.info("Email verified successfully");
      return successResponse(res, result, 200, "Email verified");
    } catch (err: any) {
      logger.error("Email verification failed:", { error: err.message });
      return errorResponse(res, err.statusCode || 500, err.message);
    }
  }

  async register(req: Request, res: Response) {
    try {
      const payload = req.body;
      validation(res, registerSchema, payload);
      const user = await this.authSvc.register(payload);
      logger.info("User registered successfully:", { email: payload.email });
      return successResponse(res, user, 201, "User registered successfully");
    } catch (err: any) {
      if (err instanceof AppError) {
        logger.error("Registration failed:", {
          error: err.message,
          email: req.body.email,
        });
        return errorResponse(res, err.statusCode, err.message);
      }
      logger.error("Registration error:", {
        error: err.message,
        email: req.body.email,
      });
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async login(req: Request, res: Response) {
    try {
      const payload = req.body;
      validation(res, loginSchema, payload);
      const tokens = await this.authSvc.login(payload);
      const csrfToken = generateCsrfToken();

      logger.debug("CSRF token generated for login");

      res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        domain: COOKIE_DOMAIN,
        sameSite: COOKIE_SAME_SITE,
        maxAge: 1000 * 60 * 60 * 24 * 7, // match REFRESH_EXPIRES (approx)
      });
      res.cookie(CSRF_COOKIE_NAME, csrfToken, {
        httpOnly: false,
        sameSite: COOKIE_SAME_SITE,
        secure: COOKIE_SECURE,
      });

      logger.info("User logged in successfully:", { email: payload.email });

      return successResponse(
        res,
        { ...tokens, csrfToken },
        200,
        "Login Success"
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        logger.error("Login failed:", {
          error: err.message,
          email: req.body.email,
        });
        return errorResponse(res, err.statusCode, err.message);
      }
      logger.error("Login error:", {
        error: err.message,
        email: req.body.email,
      });
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      // const { refreshToken } = req.body;
      const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
      if (!refreshToken)
        return errorResponse(res, 400, "refreshToken required");

      const tokens = await this.authSvc.refresh(refreshToken);

      // Rotate CSRF token for new session
      const newCsrf = generateCsrfToken();
      logger.debug("CSRF token rotated for token refresh");
      res.cookie(CSRF_COOKIE_NAME, newCsrf, {
        httpOnly: false,
        sameSite: COOKIE_SAME_SITE,
        secure: COOKIE_SECURE,
      });
      logger.info("Token refreshed successfully");
      return successResponse(res, tokens, 200, "Token Refresh");
    } catch (err: any) {
      if (err instanceof AppError) {
        logger.error("Token refresh failed:", { error: err.message });
        return errorResponse(res, err.statusCode, err.message);
      }
      logger.error("Token refresh error:", { error: err.message });
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken)
        return errorResponse(res, 400, "refreshToken required");

      await this.authSvc.logout(refreshToken);
      logger.info("User logged out successfully");
      return successResponse(res, {}, 200, "Logout");
    } catch (err: any) {
      if (err instanceof AppError) {
        logger.error("Logout failed:", { error: err.message });
        return errorResponse(res, err.statusCode, err.message);
      }
      logger.error("Logout error:", { error: err.message });
      return errorResponse(res, 500, "Internal server error", err);
    }
  }
}
