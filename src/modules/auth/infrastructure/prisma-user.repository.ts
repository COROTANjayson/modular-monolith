/**
 * Infrastructure Layer - Prisma User Repository Implementation
 * Implements IUserRepository port from Application layer
 */

import { prisma } from "../../../shared/infra/prisma";
import { IUserRepository } from "../application/ports";
import { User, UserCreateData, UserUpdateData } from "../domain/user.entity";

export class PrismaUserRepository implements IUserRepository {
  async create(data: UserCreateData): Promise<User> {
    return prisma.user.create({ data }) as Promise<User>;
  }

  async update(id: string, data: UserUpdateData): Promise<User> {
    return prisma.user.update({ where: { id }, data }) as Promise<User>;
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } }) as Promise<User | null>;
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } }) as Promise<User | null>;
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { verificationToken: token },
    }) as Promise<User | null>;
  }
}
