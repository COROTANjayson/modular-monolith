import { IUserRepository, ITokenGenerator } from "./ports";

export class LogoutUseCase {
  constructor(
    private userRepo: IUserRepository,
    private tokenGenerator: ITokenGenerator,
  ) {}

  async execute(refreshToken: string): Promise<void> {
    try {
      const tokenData = this.tokenGenerator.verifyRefreshToken(refreshToken);
      const user = await this.userRepo.findById(tokenData.id);

      if (!user) return;

      // Invalidate current session
      if (user.currentTokenId === tokenData.jti) {
        await this.userRepo.update(user.id, { currentTokenId: null });
      }
    } catch {
      // Silently fail for invalid tokens
    }
  }
}
