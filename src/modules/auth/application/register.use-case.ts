import { AuthRules } from "../domain/auth-rules";
import {
  IAuthUserRepository,
  IPasswordHasher,
  ITokenGenerator,
  IEmailService,
} from "./ports";
import { AppError } from "../../../shared/utils/app-error";
import { ERROR_CODES } from "../../../shared/utils/response-code";
import { RegisterInput, RegisterOutput } from "./auth.dto";

export class RegisterUseCase {
  constructor(
    private authUserRepo: IAuthUserRepository,
    private passwordHasher: IPasswordHasher,
    private tokenGenerator: ITokenGenerator,
    private emailService: IEmailService,
  ) {}

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    // Validate using domain rules
    if (!AuthRules.isValidEmail(input.email)) {
      throw new AppError(
        "Invalid email format",
        400,
        ERROR_CODES.AUTH_INVALID_EMAIL,
      );
    }

    const passwordCheck = AuthRules.isValidPassword(input.password);
    if (!passwordCheck.valid) {
      throw new AppError(
        passwordCheck.reason || "Invalid password",
        400,
        ERROR_CODES.AUTH_INVALID_PASSWORD,
      );
    }

    // Check if user exists
    const existing = await this.authUserRepo.findByEmail(input.email);
    if (existing) {
      throw new AppError(
        "Email already registered",
        409,
        ERROR_CODES.AUTH_EMAIL_EXISTS,
      );
    }

    // Hash password
    const hashedPassword = await this.passwordHasher.hash(input.password);

    // Generate verification token
    const verificationToken = this.tokenGenerator.generateUUID();
    const verificationTokenExpires = AuthRules.getVerificationTokenExpiry();

    // Create user
    const user = await this.authUserRepo.create({
      email: input.email,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpires,
      isVerified: false,
    });

    // Send verification email (non-blocking - don't fail registration if email fails)
    try {
      const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
      await this.emailService.sendVerificationEmail(user.email, verificationLink);
    } catch (error) {
      // Log error but don't fail registration
      console.warn('Failed to send verification email:', error);
    }

    // Auto-login after registration
    const jti = this.tokenGenerator.generateUUID();
    await this.authUserRepo.update(user.id, { currentTokenId: jti });

    const accessToken = this.tokenGenerator.generateAccessToken({
      id: user.id,
      email: user.email,
    });
    const refreshToken = this.tokenGenerator.generateRefreshToken({
      id: user.id,
      email: user.email,
      jti,
    });

    return {
      id: user.id,
      email: user.email,
      isVerified: user.isVerified,
      accessToken,
      refreshToken,
    };
  }
}
