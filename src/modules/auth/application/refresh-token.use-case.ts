import { AuthRules } from "../domain/auth-rules";
import { IAuthUserRepository, ITokenGenerator } from "./ports";
import { AuthTokens } from "./auth.dto";
import { AppError } from "../../../shared/utils/app-error";
import { AUTH_ERROR_CODES } from "../interface/auth.response-codes";

export class RefreshTokenUseCase {
  constructor(
    private userRepo: IAuthUserRepository,
    private tokenGenerator: ITokenGenerator,
  ) {}

  async execute(refreshToken: string): Promise<AuthTokens> {
    // Verify refresh token
    let tokenData: { id: string; email: string; jti: string };
    try {
      tokenData = this.tokenGenerator.verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new AppError(
        "Invalid refresh token",
        401,
        AUTH_ERROR_CODES.AUTH_INVALID_TOKEN,
      );
    }

    // Find user
    const user = await this.userRepo.findById(tokenData.id);
    if (!user) {
      throw new AppError(
        "Invalid token (user not found)",
        401,
        AUTH_ERROR_CODES.AUTH_UNAUTHORIZED,
      );
    }

    // Check token validity using domain rules by checking if session exists
    const session = await this.userRepo.findSessionByJtiOrPreviousJti(tokenData.jti);
    
    if (!session) {
      // Possible token reuse attack - revoke all sessions!
      await this.userRepo.revokeAllUserSessions(user.id);
      throw new AppError(
        "Refresh token revoked or already used",
        401,
        AUTH_ERROR_CODES.AUTH_TOKEN_EXPIRED,
      );
    }

    // Check Grace Period if it was the previous JTI
    if (session.isPreviousJti) {
      if (!session.previousJtiExpiresAt || session.previousJtiExpiresAt < new Date()) {
        // Grace period expired! Revoke sessions!
        await this.userRepo.revokeAllUserSessions(user.id);
        throw new AppError(
          "Refresh token grace period expired",
          401,
          AUTH_ERROR_CODES.AUTH_TOKEN_EXPIRED,
        );
      }
      // If grace period is valid, we allow the rotation to proceed using the currentJti
    }

    // Generate new session (rotate JTI)
    const newJti = this.tokenGenerator.generateUUID();
    const newExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days
    const gracePeriodEndsAt = new Date(Date.now() + 1000 * 15); // 15 seconds grace period
    
    // We always update the *currentJti* in the DB, even if this request came in using the previousJti
    await this.userRepo.updateSessionJti(session.currentJti, newJti, newExpiresAt, gracePeriodEndsAt);

    const accessToken = this.tokenGenerator.generateAccessToken({
      id: user.id,
      email: user.email,
    });
    const newRefreshToken = this.tokenGenerator.generateRefreshToken({
      id: user.id,
      email: user.email,
      jti: newJti,
    });

    return { accessToken, refreshToken: newRefreshToken };
  }
}
