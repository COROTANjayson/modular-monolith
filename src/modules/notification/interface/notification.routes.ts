/**
 * Interface Layer - Notification Routes
 */

import { Router } from "express";
import { NotificationController } from "./notification.controller";
import { authMiddleware } from "../../auth/interface/auth.middleware";

export function createNotificationRouter(
  controller: NotificationController,
): Router {
  const router = Router();

  // All notification routes require authentication
  router.use(authMiddleware);

  // List notifications (paginated, filterable)
  router.get("/", (req, res) => controller.getAll(req, res));

  // Unread count
  router.get("/unread-count", (req, res) =>
    controller.getUnreadCount(req, res),
  );

  // Mark all as read
  router.patch("/read-all", (req, res) => controller.markAllAsRead(req, res));

  // Mark single as read
  router.patch("/:id/read", (req, res) => controller.markAsRead(req, res));

  // Delete notification
  router.delete("/:id", (req, res) => controller.delete(req, res));

  return router;
}
