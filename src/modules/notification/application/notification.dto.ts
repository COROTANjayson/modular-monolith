/**
 * Application Layer - Notification DTOs
 */

export interface CreateNotificationDto {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  redirectUrl?: string;
}

export interface NotificationListQueryDto {
  isRead?: boolean;
  page?: number;
  limit?: number;
}
