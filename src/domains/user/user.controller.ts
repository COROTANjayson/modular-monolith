import { Request, Response } from "express";
import UserRepository from "./user.repository";
import { errorResponse, successResponse } from "../../utils/response.util";
import { logger } from "../../libs/logger";

export class UsersController {
  private userRepo = new UserRepository();
  async me(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      logger.debug("Fetching current user:", { userId });
      const user = await this.userRepo.findCurrentUser(userId);
      if (!user) {
        logger.warn("User not found:", { userId });
        return errorResponse(res, 404, "User not found");
      }

      logger.info("Current user fetched successfully:", { userId });
      return successResponse(res, user, 200, "Current User fetched");
    } catch (err: any) {
      logger.error("Error fetching current user:", {
        error: err.message,
        userId: (req as any).userId,
      });
      return res.status(500).json({ error: err.message || err });
    }
  }
}
