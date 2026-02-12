/**
 * Domain Layer - Notification Entity
 */

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, any> | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export type CreateNotificationData = Omit<
  Notification,
  "id" | "isRead" | "readAt" | "createdAt"
>;
