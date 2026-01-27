/**
 * Interface Layer - Auth Controller
 * HTTP controllers - maps requests to application use cases
 * Depends ONLY on Application layer
 */

import { Request, Response } from "express";
import {
  errorResponse,
  successResponse,
} from "../../../shared/utils/response.util";
import { AppError } from "../../../shared/utils/app-error";
import { validation } from "../../../shared/utils/validate";
import { generateCsrfToken } from "../../../shared/utils/helpers";
import {
  COOKIE_DOMAIN,
  COOKIE_SAME_SITE,
  COOKIE_SECURE,
  CSRF_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "../../../shared/utils/config";
import { logger } from "../../../shared/infra/logger";

// Import validation schemas
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  updatePasswordSchema,
} from "./validation";

// Import use cases
import { RegisterUseCase } from "../application/register.use-case";
import { LoginUseCase } from "../application/login.use-case";
import { RefreshTokenUseCase } from "../application/refresh-token.use-case";
import { LogoutUseCase } from "../application/logout.use-case";
import { VerifyEmailUseCase } from "../application/verify-email.use-case";
import { ResendVerificationUseCase } from "../application/resend-verification.use-case";
import { UpdatePasswordUseCase } from "../application/update-password.use-case";

export class AuthController {
  constructor(
    private registerUseCase: RegisterUseCase,
    private loginUseCase: LoginUseCase,
    private refreshTokenUseCase: RefreshTokenUseCase,
    private logoutUseCase: LogoutUseCase,
    private verifyEmailUseCase: VerifyEmailUseCase,
    private resendVerificationUseCase: ResendVerificationUseCase,
    private updatePasswordUseCase: UpdatePasswordUseCase,
  ) {}

  async register(req: Request, res: Response) {
    try {
      const payload = req.body;
      validation(res, registerSchema, payload);

      const result = await this.registerUseCase.execute(payload);

      logger.info("User registered successfully:", { email: payload.email });
      return successResponse(res, result, 201, "User registered successfully");
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

      const tokens = await this.loginUseCase.execute(payload);
      const csrfToken = generateCsrfToken();

      logger.debug("CSRF token generated for login");

      res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        domain: COOKIE_DOMAIN,
        sameSite: COOKIE_SAME_SITE,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
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
        "Login Success",
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
      const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
      if (!refreshToken) {
        return errorResponse(res, 400, "refreshToken required");
      }

      const tokens = await this.refreshTokenUseCase.execute(refreshToken);

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
      if (!refreshToken) {
        return errorResponse(res, 400, "refreshToken required");
      }

      await this.logoutUseCase.execute(refreshToken);
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

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.body;
      validation(res, verifyEmailSchema, { token });

      const result = await this.verifyEmailUseCase.execute(token);
      logger.info("Email verified successfully");
      return successResponse(res, result, 200, "Email verified");
    } catch (err: any) {
      logger.error("Email verification failed:", { error: err.message });
      return errorResponse(res, err.statusCode || 500, err.message);
    }
  }

  async resendVerification(req: Request, res: Response) {
    try {
      const { email } = req.body;
      validation(res, resendVerificationSchema, { email });

      const result = await this.resendVerificationUseCase.execute(email);
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
  async updatePassword(req: Request, res: Response) {
    try {
      const payload = req.body;
      const userId = (req as any).userId;

      validation(res, updatePasswordSchema, payload);

      await this.updatePasswordUseCase.execute({
        userId,
        oldPassword: payload.oldPassword,
        newPassword: payload.newPassword,
      });

      logger.info("Password updated successfully:", { userId });
      return successResponse(res, {}, 200, "Password updated successfully");
    } catch (err: any) {
      if (err instanceof AppError) {
        logger.error("Password update failed:", {
          error: err.message,
          userId: (req as any).userId,
        });
        return errorResponse(res, err.statusCode, err.message);
      }
      logger.error("Password update error:", {
        error: err.message,
        userId: (req as any).userId,
      });
      return errorResponse(res, 500, "Internal server error", err);
    }
  }
}
