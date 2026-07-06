import { IAuthUserRepository, ITokenGenerator } from "./ports";

export class LogoutUseCase {
  constructor(
    private userRepo: IAuthUserRepository,
    private tokenGenerator: ITokenGenerator,
  ) {}

  async execute(refreshToken: string): Promise<void> {
    try {
      const tokenData = this.tokenGenerator.verifyRefreshToken(refreshToken);
      const user = await this.userRepo.findById(tokenData.id);

      if (!user) return;

      // Invalidate current session
      await this.userRepo.deleteSessionByJti(tokenData.jti);
    } catch {
      // Silently fail for invalid tokens
    }
  }
}
