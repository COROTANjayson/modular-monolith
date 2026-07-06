import { prisma } from "../../../shared/infra/prisma";
import { IAuthUserRepository } from "../application/ports";
import {
  AuthUser,
  AuthUserCreateData,
  AuthUserUpdateData,
} from "../domain/auth-user.entity";

export class PrismaAuthUserRepository implements IAuthUserRepository {
  async create(data: AuthUserCreateData): Promise<AuthUser> {
    return prisma.user.create({ data }) as Promise<AuthUser>;
  }

  async update(id: string, data: AuthUserUpdateData): Promise<AuthUser> {
    return prisma.user.update({ where: { id }, data }) as Promise<AuthUser>;
  }

  async findById(id: string): Promise<AuthUser | null> {
    return prisma.user.findUnique({
      where: { id },
    }) as Promise<AuthUser | null>;
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    return prisma.user.findUnique({
      where: { email },
    }) as Promise<AuthUser | null>;
  }

  async findByVerificationToken(token: string): Promise<AuthUser | null> {
    return prisma.user.findUnique({
      where: { verificationToken: token },
    }) as Promise<AuthUser | null>;
  }

  async findByGoogleId(googleId: string): Promise<AuthUser | null> {
    return prisma.user.findUnique({
      where: { googleId },
    }) as Promise<AuthUser | null>;
  }

  async createSession(userId: string, jti: string, expiresAt: Date, deviceInfo?: string, ipAddress?: string): Promise<void> {
    await prisma.userSession.create({
      data: {
        userId,
        jti,
        expiresAt,
        deviceInfo,
        ipAddress,
      },
    });
  }

  async findSessionByJti(jti: string): Promise<{ userId: string } | null> {
    const session = await prisma.userSession.findUnique({
      where: { jti },
      select: { userId: true },
    });
    return session;
  }

  async updateSessionJti(oldJti: string, newJti: string, expiresAt: Date): Promise<void> {
    await prisma.userSession.update({
      where: { jti: oldJti },
      data: { jti: newJti, expiresAt },
    });
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await prisma.userSession.deleteMany({
      where: { userId },
    });
  }

  async deleteSessionByJti(jti: string): Promise<void> {
    await prisma.userSession.delete({
      where: { jti },
    });
  }
}
