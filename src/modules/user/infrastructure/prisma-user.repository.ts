/**
 * Infrastructure Layer - Prisma User Repository
 */

import { prisma } from "../../../shared/infra/prisma";
import { IUserRepository } from "../application/ports";
import { User, UserUpdateData } from "../domain/user.entity";

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        age: true,
        gender: true,
      },
    });

    return user as User | null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        age: true,
        gender: true,
      },
    });

    return user as User | null;
  }

  async update(id: string, data: UserUpdateData): Promise<User> {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        age: true,
        gender: true,
      },
    });

    return user as User;
  }
}
