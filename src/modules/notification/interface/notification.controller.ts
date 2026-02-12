/**
 * Interface Layer - Notification Controller
 */

import { Request, Response } from "express";
import { NotificationService } from "../application/notification.service";
import {
  successResponse,
  errorResponse,
} from "../../../shared/utils/response.util";
import { validate } from "../../../shared/utils/validate";
import { AppError } from "../../../shared/utils/app-error";
import { SUCCESS_CODES } from "../../../shared/utils/response-code";
import {
  NOTIF_SUCCESS_CODES,
} from "./notification.response-codes";
import { notificationListQuerySchema } from "./validation";

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  async getAll(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const query = validate(notificationListQuerySchema, req.query);

      const result = await this.notificationService.getUserNotifications(
        userId,
        query,
      );
      return successResponse(
        res,
        result,
        200,
        "Notifications retrieved successfully",
        NOTIF_SUCCESS_CODES.NOTIF_FETCHED,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(
          res,
          err.statusCode,
          err.message,
          err.errors,
          err.code,
        );
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const count = await this.notificationService.getUnreadCount(userId);
      return successResponse(
        res,
        { count },
        200,
        "Unread count retrieved",
        NOTIF_SUCCESS_CODES.NOTIF_UNREAD_COUNT,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(
          res,
          err.statusCode,
          err.message,
          err.errors,
          err.code,
        );
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async markAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;

      const notification = await this.notificationService.markAsRead(
        id,
        userId,
      );
      return successResponse(
        res,
        notification,
        200,
        "Notification marked as read",
        NOTIF_SUCCESS_CODES.NOTIF_MARKED_READ,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(
          res,
          err.statusCode,
          err.message,
          err.errors,
          err.code,
        );
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      await this.notificationService.markAllAsRead(userId);
      return successResponse(
        res,
        null,
        200,
        "All notifications marked as read",
        NOTIF_SUCCESS_CODES.NOTIF_ALL_MARKED_READ,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(
          res,
          err.statusCode,
          err.message,
          err.errors,
          err.code,
        );
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;

      await this.notificationService.delete(id, userId);
      return successResponse(
        res,
        null,
        200,
        "Notification deleted",
        NOTIF_SUCCESS_CODES.NOTIF_DELETED,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(
          res,
          err.statusCode,
          err.message,
          err.errors,
          err.code,
        );
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }
}
