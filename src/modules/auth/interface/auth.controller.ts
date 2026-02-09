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
import { validate } from "../../../shared/utils/validate";
import { generateCsrfToken } from "../../../shared/utils/helpers";
import {
  SUCCESS_CODES,
  ERROR_CODES,
} from "../../../shared/utils/response-code";
import {
  AUTH_SUCCESS_CODES,
  AUTH_ERROR_CODES,
} from "./auth.response-codes";
import {
  COOKIE_DOMAIN,
  COOKIE_SAME_SITE,
  COOKIE_SECURE,
  CSRF_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  CLIENT_URL,
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
      const validatedData = validate(registerSchema, req.body);

      const result = await this.registerUseCase.execute(validatedData);

      logger.info("User registered successfully:", {
        email: validatedData.email,
      });
      return successResponse(
        res,
        result,
        201,
        "User registered successfully",
        AUTH_SUCCESS_CODES.AUTH_REGISTER_SUCCESS,
      );
    } catch (error: any) {
      // Skip logging in test environment
      if (process.env.NODE_ENV !== 'test') {
        logger.error("Registration failed:", error);
      }

      if (error instanceof AppError) {
        return errorResponse(
          res,
          error.statusCode,
          error.message,
          error.errors,
          error.code,
        );
      }
      return errorResponse(res, 500, "Internal server error", error);
    }
  }

  async login(req: Request, res: Response) {
    try {
      const validatedData = validate(loginSchema, req.body);

      const tokens = await this.loginUseCase.execute(validatedData);
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

      logger.info("User logged in successfully:", {
        email: validatedData.email,
      });

      return successResponse(
        res,
        { ...tokens, csrfToken },
        200,
        "Login Success",
        AUTH_SUCCESS_CODES.AUTH_LOGIN_SUCCESS,
      );
    } catch (err: any) {
      // Skip logging in test environment
      if (process.env.NODE_ENV !== 'test') {
        if (err instanceof AppError) {
          logger.error("Login failed:", {
            error: err.message,
            email: req.body.email,
          });
        } else {
          logger.error("Login error:", {
            error: err.message,
            email: req.body.email,
          });
        }
      }

      if (err instanceof AppError) {
        return errorResponse(
          res,
          err.statusCode,
          err.message,
          err.errors,
          err.code,
        );
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
      if (!refreshToken) {
        return errorResponse(
          res,
          400,
          "refreshToken required",
          null,
          AUTH_ERROR_CODES.AUTH_INVALID_TOKEN,
        );
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
      return successResponse(
        res,
        tokens,
        200,
        "Token Refresh",
        AUTH_SUCCESS_CODES.AUTH_TOKEN_REFRESH_SUCCESS,
      );
    } catch (err: any) {
      // Clear cookies on any refresh error to prevent stuck sessions
      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        domain: COOKIE_DOMAIN,
        sameSite: COOKIE_SAME_SITE,
        maxAge: 0,
      });
      res.clearCookie(CSRF_COOKIE_NAME, {
        httpOnly: false,
        secure: COOKIE_SECURE,
        sameSite: COOKIE_SAME_SITE,
        maxAge: 0,
      });

      if (err instanceof AppError) {
        logger.error("Token refresh failed:", { error: err.message });
        return errorResponse(res, err.statusCode, err.message, null, err.code);
      }
      logger.error("Token refresh error:", { error: err.message });
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
      if (refreshToken) {
        await this.logoutUseCase.execute(refreshToken);
      }

      res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        domain: COOKIE_DOMAIN,
        sameSite: COOKIE_SAME_SITE,
        maxAge: 0,
      });

      res.clearCookie(CSRF_COOKIE_NAME, {
        httpOnly: false,
        secure: COOKIE_SECURE,
        sameSite: COOKIE_SAME_SITE,
        maxAge: 0,
      });

      logger.info("User logged out successfully");
      return successResponse(
        res,
        {},
        200,
        "Logout",
        AUTH_SUCCESS_CODES.AUTH_LOGOUT_SUCCESS,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        logger.error("Logout failed:", { error: err.message });
        return errorResponse(res, err.statusCode, err.message, null, err.code);
      }
      logger.error("Logout error:", { error: err.message });
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const validatedData = validate(verifyEmailSchema, req.body);

      const result = await this.verifyEmailUseCase.execute(validatedData.token);
      logger.info("Email verified successfully");
      return successResponse(
        res,
        result,
        200,
        "Email verified",
        AUTH_SUCCESS_CODES.AUTH_EMAIL_VERIFIED,
      );
    } catch (err: any) {
      logger.error("Email verification failed:", { error: err.message });
      return errorResponse(
        res,
        err.statusCode || 500,
        err.message,
        err.errors,
        err.code,
      );
    }
  }

  async resendVerification(req: Request, res: Response) {
    try {
      const validatedData = validate(resendVerificationSchema, req.body);

      const result = await this.resendVerificationUseCase.execute(
        validatedData.email,
      );
      logger.info("Verification email resent:", { email: validatedData.email });
      return successResponse(
        res,
        result,
        200,
        "Verification email sent",
        AUTH_SUCCESS_CODES.AUTH_VERIFICATION_SENT,
      );
    } catch (err: any) {
      logger.error("Resend verification failed:", {
        error: err.message,
        email: req.body.email,
      });
      return errorResponse(
        res,
        err.statusCode || 500,
        err.message,
        err.errors,
        err.code,
      );
    }
  }
  async updatePassword(req: Request, res: Response) {
    try {
      const validatedData = validate(updatePasswordSchema, req.body);
      const userId = (req as any).userId;

      await this.updatePasswordUseCase.execute({
        userId,
        oldPassword: validatedData.oldPassword,
        newPassword: validatedData.newPassword,
      });

      logger.info("Password updated successfully:", { userId });
      return successResponse(
        res,
        {},
        200,
        "Password updated successfully",
        AUTH_SUCCESS_CODES.AUTH_PASSWORD_UPDATED,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        logger.error("Password update failed:", {
          error: err.message,
          userId: (req as any).userId,
        });
        return errorResponse(
          res,
          err.statusCode,
          err.message,
          err.errors,
          err.code,
        );
      }
      logger.error("Password update error:", {
        error: err.message,
        userId: (req as any).userId,
      });
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async googleCallback(req: Request, res: Response) {
    try {
      const { user, accessToken, refreshToken } = req.user as any;
      const csrfToken = generateCsrfToken();

      res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        domain: COOKIE_DOMAIN,
        sameSite: COOKIE_SAME_SITE,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      });
      
      res.cookie(CSRF_COOKIE_NAME, csrfToken, {
        httpOnly: false,
        sameSite: COOKIE_SAME_SITE, // Must match what frontend expects
        secure: COOKIE_SECURE,
      });

      // Redirect to frontend dashboard
      logger.info("Google login successful, redirecting to frontend", {
        userId: user.id,
      });
      return res.redirect(`${CLIENT_URL}/dashboard`);
    } catch (error) {
       logger.error("Google callback failed", error);
       return res.redirect(`${CLIENT_URL}/login?error=google_auth_failed`);
    }
  }
}
