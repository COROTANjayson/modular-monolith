import { AuthRules } from "../domain/auth-rules";
import { IUserRepository, IPasswordHasher, ITokenGenerator } from "./ports";
import { LoginInput, AuthTokens } from "./auth.dto";

export class LoginUseCase {
  constructor(
    private userRepo: IUserRepository,
    private passwordHasher: IPasswordHasher,
    private tokenGenerator: ITokenGenerator,
  ) {}

  async execute(input: LoginInput): Promise<AuthTokens> {
    // Find user
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new Error("Email does not exist");
    }

    // Check domain rules
    const canLogin = AuthRules.canLogin(user);
    if (!canLogin.allowed) {
      throw new Error(canLogin.reason || "Cannot login");
    }

    // Verify password
    const passwordValid = await this.passwordHasher.compare(
      input.password,
      user.password,
    );
    if (!passwordValid) {
      throw new Error("Invalid credentials");
    }

    // Generate new session
    const jti = this.tokenGenerator.generateUUID();
    await this.userRepo.update(user.id, { currentTokenId: jti });

    const accessToken = this.tokenGenerator.generateAccessToken({
      id: user.id,
      email: user.email,
    });
    const refreshToken = this.tokenGenerator.generateRefreshToken({
      id: user.id,
      email: user.email,
      jti,
    });

    return { accessToken, refreshToken };
  }
}
