import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import passport from "passport";
import { FindOrCreateGoogleUserUseCase } from "../application/find-or-create-google-user.use-case";
import { logger } from "../../../shared/infra/logger";
import { AppError } from "../../../shared/utils/app-error";
import { AUTH_ERROR_CODES } from "../interface/auth.response-codes";

export class GoogleStrategyAdapter {
  constructor(private findOrCreateUseCase: FindOrCreateGoogleUserUseCase) {
    this.validateEnvironment();
    this.init();
  }

  private validateEnvironment() {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error(
        "Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables."
      );
    }

    if (!process.env.GOOGLE_CALLBACK_URL) {
      throw new Error(
        "Google OAuth callback URL not configured. Please set GOOGLE_CALLBACK_URL environment variable."
      );
    }

    logger.info("Google OAuth configuration validated");
  }

  init() {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          callbackURL: process.env.GOOGLE_CALLBACK_URL!,
        },
        async (
          accessToken: string,
          refreshToken: string,
          profile: Profile,
          done: VerifyCallback
        ) => {
          try {
            logger.info("Google OAuth profile received", { 
              googleId: profile.id,
              displayName: profile.displayName 
            });

            const emailData = profile.emails?.[0];
            
            if (!emailData?.value) {
              logger.error("No email found in Google profile", { googleId: profile.id });
              return done(
                new AppError(
                  "No email found from Google",
                  400,
                  AUTH_ERROR_CODES.AUTH_GOOGLE_NO_EMAIL
                ),
                undefined
              );
            }

            // Check if email is verified by Google
            if (!emailData.verified) {
              logger.error("Google email not verified", { 
                googleId: profile.id,
                email: emailData.value 
              });
              return done(
                new AppError(
                  "Google email not verified",
                  400,
                  AUTH_ERROR_CODES.AUTH_GOOGLE_EMAIL_UNVERIFIED
                ),
                undefined
              );
            }

            const email = emailData.value;
            const googleId = profile.id;
            const avatar = profile.photos?.[0]?.value;
            const firstName = profile.name?.givenName;
            const lastName = profile.name?.familyName;

            logger.debug("Processing Google OAuth login", { 
              email, 
              googleId,
              verified: emailData.verified 
            });

            const result = await this.findOrCreateUseCase.execute({
              email,
              googleId,
              avatar,
              firstName,
              lastName,
            });

            logger.info("Google OAuth login successful", { userId: result.user.id });
            return done(null, result);
          } catch (error) {
            logger.error("Google OAuth strategy error", { 
              error: error instanceof Error ? error.message : error 
            });
            return done(error as Error, undefined);
          }
        }
      )
    );
  }
}
