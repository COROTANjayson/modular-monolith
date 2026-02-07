/**
 * Interface Layer - User Controller
 */

import { Request, Response } from "express";
import { UserService } from "../application/user.service";
import { UpdateUserDto } from "../application/user.dto";
import { UpdateUserSchema } from "./validation";
import {
  successResponse,
  errorResponse,
} from "../../../shared/utils/response.util";
import { AppError } from "../../../shared/utils/app-error";
import {
  SUCCESS_CODES,
  ERROR_CODES,
} from "../../../shared/utils/response-code";
import { USER_SUCCESS_CODES } from "./user.response-codes";
import { validate } from "../../../shared/utils/validate";

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
        USER_SUCCESS_CODES.USER_DATA_FETCHED,
      );
    } catch (error: any) {
      if (error instanceof AppError) {
        return errorResponse(
          res,
          error.statusCode,
          error.message,
          error.errors,
          error.code,
        );
      }
      return errorResponse(res, 500, "Internal server error");
    }
  }

  async updateMe(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const validatedData = validate(UpdateUserSchema, req.body) as UpdateUserDto;

      const user = await this.userService.updateUser(userId, validatedData);
      return successResponse(
        res,
        user,
        200,
        "User updated successfully",
        USER_SUCCESS_CODES.USER_DATA_UPDATED,
      );
    } catch (error: any) {
      if (error instanceof AppError) {
        return errorResponse(
          res,
          error.statusCode,
          error.message,
          error.errors,
          error.code,
        );
      }
      return errorResponse(res, 500, "Internal server error");
    }
  }
}
