import { AuthUser } from "../domain/auth-user.entity";
import { IAuthUserRepository, ITokenGenerator } from "./ports";
import { logger } from "../../../shared/infra/logger";

export class FindOrCreateGoogleUserUseCase {
  constructor(
    private userRepo: IAuthUserRepository,
    private tokenGenerator: ITokenGenerator
  ) {}

  async execute(profile: {
    googleId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  }): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    // 1. Check if user exists by googleId first (most reliable)
    let user = await this.userRepo.findByGoogleId(profile.googleId);

    if (user) {
      logger.info("User found by Google ID", { 
        userId: user.id, 
        googleId: profile.googleId 
      });
      
      // Update avatar if it has changed
      if (user.avatar !== profile.avatar && profile.avatar) {
        logger.debug("Updating user avatar from Google", { userId: user.id });
        user = await this.userRepo.update(user.id, { 
          avatar: profile.avatar 
        });
      }
    } else {
      // 2. Check if user exists by email (for account linking)
      user = await this.userRepo.findByEmail(profile.email);

      if (user) {
        // Link Google account to existing user
        logger.info("Linking Google account to existing user", { 
          userId: user.id, 
          googleId: profile.googleId,
          email: profile.email 
        });
        
        user = await this.userRepo.update(user.id, {
          googleId: profile.googleId,
          avatar: user.avatar || profile.avatar,
          isVerified: true, // Google emails are verified
        });
      } else {
        // 3. Create new user from Google profile
        logger.info("Creating new user from Google", { 
          email: profile.email,
          googleId: profile.googleId 
        });

        user = await this.userRepo.create({
          email: profile.email,
          googleId: profile.googleId,
          avatar: profile.avatar,
          isVerified: true,
          password: undefined, // No password for Google-only accounts
        });
        
        logger.info("New Google user created successfully", { userId: user.id });
      }
    }
    
    // 4. Generate Tokens
    const jti = this.tokenGenerator.generateUUID();

    // Update user with currentTokenId (for refresh token rotation)
    await this.userRepo.update(user.id, { currentTokenId: jti });

    const accessToken = this.tokenGenerator.generateAccessToken({ id: user.id, email: user.email });
    const refreshToken = this.tokenGenerator.generateRefreshToken({ 
      id: user.id, 
      email: user.email,
      jti: jti 
    });

    logger.debug("Tokens generated for Google OAuth user", { userId: user.id });

    return { user, accessToken, refreshToken };
  }
}
