import { prisma } from "../../libs/prisma";
import UserEntity from "./user.entity";

export default class UserRepository {
  async create(data: UserEntity) {
    return prisma.user.create({ data });
  }
  async update(id: string, data: Partial<UserEntity>) {
    return prisma.user.update({ where: { id }, data });
  }
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }
  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }
  async findCurrentUser(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        age: true,
        createdAt: true,
      },
    });
  }
  async delete(id: string) {
    return prisma.user.delete({ where: { id } });
  }

  async findByVerificationToken(token: string) {
    return prisma.user.findUnique({ where: { verificationToken: token } });
  }
}
