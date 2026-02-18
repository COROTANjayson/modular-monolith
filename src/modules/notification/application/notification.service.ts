/**
 * Application Layer - Notification Service
 */

import {
  INotificationRepository,
  NotificationListOptions,
} from "../domain/notification.repository";
import { Notification } from "../domain/notification.entity";
import {
  CreateNotificationDto,
  NotificationListQueryDto,
} from "./notification.dto";
import { AppError } from "../../../shared/utils/app-error";
import { ERROR_CODES } from "../../../shared/utils/response-code";
import { NOTIF_ERROR_CODES } from "../interface/notification.response-codes";
import { eventBus } from "../../../shared/infra/event-bus";

export class NotificationService {
  constructor(private notificationRepo: INotificationRepository) {}

  /**
   * Create a notification and emit event for real-time delivery.
   * This is the method other modules will call (via eventBus or directly).
   */
  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = await this.notificationRepo.create({
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      metadata: dto.metadata || null,
    });

    // Emit event for WebSocket gateway to push in real-time
    eventBus.emit("notification.created", {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata,
    });

    return notification;
  }

  /**
   * Get paginated notifications for a user.
   */
  async getUserNotifications(
    userId: string,
    query: NotificationListQueryDto,
  ): Promise<{ notifications: Notification[]; total: number }> {
    const options: NotificationListOptions = {
      isRead: query.isRead,
      page: query.page || 1,
      limit: query.limit || 20,
    };

    const notifications = await this.notificationRepo.findByUserId(
      userId,
      options,
    );

    return { notifications, total: notifications.length };
  }

  /**
   * Get unread notification count for a user.
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.countUnread(userId);
  }

  /**
   * Mark a single notification as read (with ownership check).
   */
  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepo.findById(id);
    if (!notification) {
      throw new AppError(
        "Notification not found",
        404,
        NOTIF_ERROR_CODES.NOTIF_NOT_FOUND,
      );
    }

    if (notification.userId !== userId) {
      throw new AppError(
        "You do not have access to this notification",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }

    const updatedNotification = await this.notificationRepo.markAsRead(id);

    // Emit event for real-time updates (e.g. sync other tabs)
    eventBus.emit("notification.read", {
      notificationId: id,
      userId,
    });

    return updatedNotification;
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.markAllAsRead(userId);

    // Emit event for real-time updates
    eventBus.emit("notification.all_read", {
      userId,
    });
  }

  /**
   * Delete a single notification (with ownership check).
   */
  async delete(id: string, userId: string): Promise<void> {
    const notification = await this.notificationRepo.findById(id);
    if (!notification) {
      throw new AppError(
        "Notification not found",
        404,
        NOTIF_ERROR_CODES.NOTIF_NOT_FOUND,
      );
    }

    if (notification.userId !== userId) {
      throw new AppError(
        "You do not have access to this notification",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }

    await this.notificationRepo.delete(id);
  }
}
