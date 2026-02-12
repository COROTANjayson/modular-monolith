/**
 * Domain Layer - Notification Repository Port
 */

import { Notification, CreateNotificationData } from "./notification.entity";

export interface NotificationListOptions {
  isRead?: boolean;
  page?: number;
  limit?: number;
}

export interface INotificationRepository {
  create(data: CreateNotificationData): Promise<Notification>;
  findByUserId(
    userId: string,
    options?: NotificationListOptions,
  ): Promise<Notification[]>;
  findById(id: string): Promise<Notification | null>;
  markAsRead(id: string): Promise<Notification>;
  markAllAsRead(userId: string): Promise<void>;
  delete(id: string): Promise<void>;
  countUnread(userId: string): Promise<number>;
}
