/**
 * Infrastructure Layer - Prisma Notification Repository
 */

import { Prisma } from "@prisma/client";
import { prisma } from "../../../shared/infra/prisma";
import {
  INotificationRepository,
  NotificationListOptions,
} from "../domain/notification.repository";
import {
  Notification,
  CreateNotificationData,
} from "../domain/notification.entity";

export class PrismaNotificationRepository implements INotificationRepository {
  async create(data: CreateNotificationData): Promise<Notification> {
    return (await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata:
          data.metadata === null ? Prisma.JsonNull : data.metadata ?? undefined,
        redirectUrl: data.redirectUrl,
      },
    })) as unknown as Notification;
  }

  async findByUserId(
    userId: string,
    options?: NotificationListOptions,
  ): Promise<Notification[]> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (options?.isRead !== undefined) {
      where.isRead = options.isRead;
    }

    return (await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    })) as unknown as Notification[];
  }

  async findById(id: string): Promise<Notification | null> {
    return (await prisma.notification.findUnique({
      where: { id },
    })) as unknown as Notification | null;
  }

  async markAsRead(id: string): Promise<Notification> {
    return (await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    })) as unknown as Notification;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.notification.delete({
      where: { id },
    });
  }

  async countUnread(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}
