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

    // Check token validity using domain rules
    if (!AuthRules.isRefreshTokenValid(tokenData.jti, user.currentTokenId)) {
      throw new AppError(
        "Refresh token revoked or already used",
        401,
        AUTH_ERROR_CODES.AUTH_TOKEN_EXPIRED,
      );
    }

    // Generate new session
    const newJti = this.tokenGenerator.generateUUID();
    await this.userRepo.update(user.id, { currentTokenId: newJti });

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
