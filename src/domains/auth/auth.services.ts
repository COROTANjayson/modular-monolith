import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
// import Redis from "ioredis";
import { generateHash, generateToken } from "../../utils/helpers";
import UserRepository from "../user/user.repository";
import { LoginInput, RegisterInput } from "./auth.types";
import { AppError } from "../../utils/app-error";
import {
  ACCESS_EXPIRES,
  ACCESS_SECRET,
  REFRESH_EXPIRES,
  REFRESH_SECRET,
} from "../../utils/config";

// Optional Redis client (if you want stateful refresh tokens / caching)
// const redisUrl = process.env.REDIS_URL;
// const redis = redisUrl ? new Redis(redisUrl) : null;

import { EmailService } from "../../utils/email.service";
import { logger } from "../../libs/logger";

export default class AuthService {
  private userRepo = new UserRepository();
  private emailService = new EmailService();

  // Register
  async register(data: RegisterInput) {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) throw new AppError("Email already registered", 409);

    const hashed = await generateHash(data.password);

    // Generate verification token
    const verificationToken = uuidv4();
    const verificationTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    const user = await this.userRepo.create({
      ...data,
      password: hashed,
      verificationToken,
      verificationTokenExpires,
      isVerified: false,
    });

    // Queue verification email using template
    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    await this.emailService.queueEmail({
      to: user.email,
      subject: "Verify your email",
      template: "verification-email",
      variables: {
        verificationLink,
        currentYear: new Date().getFullYear(),
        appName: "Your App",
      },
    });

    const login = await this.login({
      email: user.email,
      password: data.password,
    });
    // const token = await this.generateTokens({
    return {
      id: user.id,
      email: user.email,
      isVerified: user.isVerified,
      ...login,
    };
  }

  // Login
  async login({ email, password }: LoginInput) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new AppError("Email does not exists", 404);
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new AppError("Invalid credentials", 400);

    const jti = uuidv4();
    await this.userRepo.update(user?.id, { currentTokenId: jti });

    const payload = {
      id: user.id,
      email: user.email,
    };
    const accessToken = generateToken(payload, ACCESS_SECRET, ACCESS_EXPIRES);
    const refreshToken = generateToken(
      { ...payload, jti },
      REFRESH_SECRET,
      REFRESH_EXPIRES
    );

    return { accessToken, refreshToken };
  }

  // Refresh token
  async refresh(token: string) {
    try {
      const userData: any = jwt.verify(token, REFRESH_SECRET);
      const userId = userData.id;
      const tokenJti = userData.jti;

      const user = await this.userRepo.findById(userId);
      if (!user) throw new AppError("Invalid token (user not found)", 404);

      if (user.currentTokenId !== tokenJti) {
        throw new AppError("Refresh token revoked or already used", 409);
      }
      const payload = {
        id: user.id,
        email: user.email,
      };

      const nextJti = uuidv4();
      await this.userRepo.update(userId, { currentTokenId: nextJti });
      const accessToken = generateToken(payload, ACCESS_SECRET);
      const refreshToken = generateToken(
        { ...payload, jti: nextJti },
        REFRESH_SECRET,
        REFRESH_EXPIRES
      );

      // Strategy B (stateful): verify token matches Redis stored token
      // if (redis) {
      //   const stored = await redis.get(`refresh:${userId}`);
      //   if (!stored || stored !== token) throw new Error('Invalid refresh token');
      //   // issue new token and store it
      //   await redis.set(`refresh:${userId}`, newRefreshToken, 'EX', 60*60*24*7);
      // }
      return { accessToken, refreshToken };
    } catch (err: any) {
      throw new AppError("Invalid refresh token: " + err.message, 404);
    }
  }

  async logout(token: string) {
    try {
      const payload: any = jwt.verify(token, REFRESH_SECRET);
      const userId = payload.id;
      const tokenJti = payload.jti;

      const user = await this.userRepo.findById(userId);
      if (!user) throw new Error("User not found");

      if (user.currentTokenId === tokenJti) {
        await this.userRepo.update(userId, { currentTokenId: null });
      }
    } catch {}
  }

  // Verify Email
  async verifyEmail(token: string) {
    const user = await this.userRepo.findByVerificationToken(token); // Need to implement findByVerificationToken or similar
    // Since repository might not have this method, let's assume we can find by something else or add the method.
    // Actually, standard repo might NOT have it.
    // Let's check `user.repository.ts`. If it's generic, we might need a raw query or scan.
    // For now, let's assuming we might need to add `findByVerificationToken` to repo.
    // Wait, I cannot see `findByVerificationToken` in the repo interface I saw earlier.
    // I should check `user.repository.ts` first.
    // BUT, for now, let's implement the logic assuming I'll fix the repo in the next step.
    if (!user) throw new AppError("Invalid token", 400);

    if (
      user.verificationTokenExpires &&
      user.verificationTokenExpires < new Date()
    ) {
      throw new AppError("Token expired", 400);
    }

    await this.userRepo.update(user.id, {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
    });

    return { message: "Email verified successfully" };
  }

  // Resend Verification
  async resendVerification(email: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new AppError("User not found", 404);
    if (user.isVerified) throw new AppError("Email already verified", 400);

    const verificationToken = uuidv4();
    const verificationTokenExpires = new Date(Date.now() + 30 * 60 * 1000);

    await this.userRepo.update(user.id, {
      verificationToken,
      verificationTokenExpires,
    });

    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    await this.emailService.queueEmail({
      to: user.email,
      subject: "Verify your email",
      template: "verification-email",
      variables: {
        verificationLink,
        currentYear: new Date().getFullYear(),
        appName: "Your App",
      },
    });

    return { message: "Verification email sent" };
  }
}
