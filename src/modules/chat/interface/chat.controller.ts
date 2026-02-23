/**
 * Interface Layer - Chat Controller
 */

import { Request, Response, NextFunction } from "express";
import { ChatService } from "../application/chat.service";
import {
  successResponse,
  errorResponse,
} from "../../../shared/utils/response.util";
import { AppError } from "../../../shared/utils/app-error";
import { CHAT_SUCCESS_CODES } from "./chat.response-codes";

export class ChatController {
  constructor(private chatService: ChatService) {}

  getMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { teamId } = req.params;
      const userId = (req as any).userId;
      const cursor = req.query.cursor as string | undefined;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : undefined;

      const messages = await this.chatService.getMessages(
        teamId,
        userId,
        cursor,
        limit,
      );

      return successResponse(
        res,
        messages,
        200,
        "Messages retrieved successfully",
        CHAT_SUCCESS_CODES.MESSAGES_FETCHED,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(res, err.statusCode, err.message, err.errors, err.code);
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  };
}
