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
}
