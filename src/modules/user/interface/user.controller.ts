/**
 * Interface Layer - User Controller
 */

import { Request, Response } from "express";
import { UserService } from "../application/user.service";
import { UpdateUserSchema } from "../application/user.dto";
import {
  successResponse,
  errorResponse,
} from "../../../shared/utils/response.util";
import { AppError } from "../../../shared/utils/app-error";
import {
  SUCCESS_CODES,
  ERROR_CODES,
} from "../../../shared/utils/response-code";

export class UserController {
  constructor(private userService: UserService) {}

  async getMe(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const user = await this.userService.getUserById(userId);
      return successResponse(
        res,
        user,
        200,
        "User data retrieved successfully",
        SUCCESS_CODES.USER_DATA_FETCHED,
      );
    } catch (error: any) {
      if (error instanceof AppError) {
        return errorResponse(
          res,
          error.statusCode,
          error.message,
          null,
          error.code,
        );
      }
      return errorResponse(res, 500, "Internal server error");
    }
  }

  async updateMe(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      const validation = UpdateUserSchema.safeParse(req.body);
      if (!validation.success) {
        return errorResponse(
          res,
          400,
          "Validation failed",
          validation.error.format(),
          ERROR_CODES.VALIDATION_ERROR,
        );
      }

      const user = await this.userService.updateUser(userId, validation.data);
      return successResponse(
        res,
        user,
        200,
        "User updated successfully",
        SUCCESS_CODES.USER_DATA_UPDATED,
      );
    } catch (error: any) {
      if (error instanceof AppError) {
        return errorResponse(
          res,
          error.statusCode,
          error.message,
          null,
          error.code,
        );
      }
      return errorResponse(res, 500, "Internal server error");
    }
  }
}
