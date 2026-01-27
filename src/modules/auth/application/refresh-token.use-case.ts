import { AuthRules } from "../domain/auth-rules";
import { IUserRepository, ITokenGenerator } from "./ports";
import { AuthTokens } from "./auth.dto";

export class RefreshTokenUseCase {
  constructor(
    private userRepo: IUserRepository,
    private tokenGenerator: ITokenGenerator,
  ) {}

  async execute(refreshToken: string): Promise<AuthTokens> {
    // Verify refresh token
    let tokenData: { id: string; email: string; jti: string };
    try {
      tokenData = this.tokenGenerator.verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new Error("Invalid refresh token");
    }

    // Find user
    const user = await this.userRepo.findById(tokenData.id);
    if (!user) {
      throw new Error("Invalid token (user not found)");
    }

    // Check token validity using domain rules
    if (!AuthRules.isRefreshTokenValid(tokenData.jti, user.currentTokenId)) {
      throw new Error("Refresh token revoked or already used");
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
