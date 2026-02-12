/**
 * Interface Layer - Notification WebSocket Gateway
 *
 * Handles the /notifications Socket.IO namespace.
 * - Authenticates connections via JWT
 * - Joins users to personal rooms for targeted delivery
 * - Listens to EventBus for new notifications and pushes them in real-time
 * - Handles client events: mark-as-read, mark-all-read
 */

import { Namespace } from "socket.io";
import {
  getIO,
  socketAuthMiddleware,
  joinUserRoom,
} from "../../../shared/infra/websocket";
import { eventBus } from "../../../shared/infra/event-bus";
import { NotificationService } from "../application/notification.service";
import { logger } from "../../../shared/infra/logger";

export class NotificationGateway {
  private namespace: Namespace | null = null;

  constructor(private notificationService: NotificationService) {}

  /**
   * Initialize the /notifications namespace.
   * Call this after Socket.IO has been initialized (in server.ts).
   */
  initialize(): void {
    try {
      const io = getIO();
      this.namespace = io.of("/notifications");

      // Apply JWT auth middleware
      this.namespace.use(socketAuthMiddleware);

      // Handle new connections
      this.namespace.on("connection", (socket) => {
        const userId = socket.data.userId;
        logger.info(
          `[Notification WS] User ${userId} connected (socket: ${socket.id})`,
        );

        // Join personal room for targeted delivery
        joinUserRoom(socket);

        // Send initial unread count
        this.sendUnreadCount(userId);

        // Handle client events
        socket.on("mark-as-read", async (data: { notificationId: string }) => {
          try {
            await this.notificationService.markAsRead(
              data.notificationId,
              userId,
            );
            socket.emit("notification-read", {
              notificationId: data.notificationId,
            });
            this.sendUnreadCount(userId);
          } catch (err) {
            socket.emit("error", { message: "Failed to mark as read" });
          }
        });

        socket.on("mark-all-read", async () => {
          try {
            await this.notificationService.markAllAsRead(userId);
            socket.emit("all-notifications-read");
            this.sendUnreadCount(userId);
          } catch (err) {
            socket.emit("error", { message: "Failed to mark all as read" });
          }
        });

        socket.on("disconnect", () => {
          logger.info(
            `[Notification WS] User ${userId} disconnected (socket: ${socket.id})`,
          );
        });
      });

      // Listen for new notifications from EventBus and push to users
      eventBus.on("notification.created", (payload) => {
        if (this.namespace) {
          this.namespace
            .to(`user:${payload.userId}`)
            .emit("new-notification", payload);

          // Also update unread count
          this.sendUnreadCount(payload.userId);
        }
      });

      logger.info("✓ Notification WebSocket gateway initialized (/notifications)");
    } catch (err) {
      // Socket.IO may not be initialized (e.g., in tests)
      logger.warn(
        "[Notification WS] Could not initialize - Socket.IO may not be available",
      );
    }
  }

  /**
   * Send updated unread count to a specific user's room.
   */
  private async sendUnreadCount(userId: string): Promise<void> {
    try {
      const count = await this.notificationService.getUnreadCount(userId);
      if (this.namespace) {
        this.namespace.to(`user:${userId}`).emit("unread-count", { count });
      }
    } catch (err) {
      logger.error(`Failed to send unread count for user ${userId}:`, err);
    }
  }
}
