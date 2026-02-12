/**
 * Application Layer - Notification DTOs
 */

export interface CreateNotificationDto {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface NotificationListQueryDto {
  isRead?: boolean;
  page?: number;
  limit?: number;
}
