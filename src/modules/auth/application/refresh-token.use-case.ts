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
    const session = await this.userRepo.findSessionByJti(tokenData.jti);
    if (!AuthRules.isRefreshTokenValid(!!session)) {
      // Possible token reuse attack - revoke all sessions!
      await this.userRepo.revokeAllUserSessions(user.id);
      throw new AppError(
        "Refresh token revoked or already used",
        401,
        AUTH_ERROR_CODES.AUTH_TOKEN_EXPIRED,
      );
    }

    // Generate new session (rotate JTI)
    const newJti = this.tokenGenerator.generateUUID();
    const newExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days
    await this.userRepo.updateSessionJti(tokenData.jti, newJti, newExpiresAt);

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
