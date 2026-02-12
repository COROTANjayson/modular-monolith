/**
 * Notification Module - Public API
 */

import { Router } from "express";
import { PrismaNotificationRepository } from "./infrastructure/prisma-notification.repository";
import { NotificationService } from "./application/notification.service";
import { NotificationController } from "./interface/notification.controller";
import { createNotificationRouter } from "./interface/notification.routes";
import { NotificationGateway } from "./interface/notification.gateway";

export function createNotificationModule(): {
  router: Router;
  notificationService: NotificationService;
  notificationGateway: NotificationGateway;
} {
  // Infrastructure
  const notificationRepo = new PrismaNotificationRepository();

  // Application
  const notificationService = new NotificationService(notificationRepo);

  // Interface - REST
  const controller = new NotificationController(notificationService);
  const router = createNotificationRouter(controller);

  // Interface - WebSocket
  const notificationGateway = new NotificationGateway(notificationService);

  return { router, notificationService, notificationGateway };
}
