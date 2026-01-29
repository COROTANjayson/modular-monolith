import { AuthRules } from "../domain/auth-rules";
import { IAuthUserRepository, IPasswordHasher, ITokenGenerator } from "./ports";
import { LoginInput, AuthTokens } from "./auth.dto";
import { AppError } from "../../../shared/utils/app-error";
import { ERROR_CODES } from "../../../shared/utils/response-code";

export class LoginUseCase {
  constructor(
    private userRepo: IAuthUserRepository,
    private passwordHasher: IPasswordHasher,
    private tokenGenerator: ITokenGenerator,
  ) {}

  async execute(input: LoginInput): Promise<AuthTokens> {
    // Find user
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new AppError(
        "Email does not exist",
        404,
        ERROR_CODES.AUTH_USER_NOT_FOUND,
      );
    }

    // Check domain rules
    const canLogin = AuthRules.canLogin(user);
    if (!canLogin.allowed) {
      throw new AppError(
        canLogin.reason || "Cannot login",
        401,
        ERROR_CODES.AUTH_NOT_VERIFIED,
      );
    }

    // Verify password
    const passwordValid = await this.passwordHasher.compare(
      input.password,
      user.password,
    );
    if (!passwordValid) {
      throw new AppError(
        "Invalid credentials",
        401,
        ERROR_CODES.AUTH_INVALID_CREDENTIALS,
      );
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
