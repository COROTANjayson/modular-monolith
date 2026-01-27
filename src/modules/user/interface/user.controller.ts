/**
 * Interface Layer - User Controller
 */

import { Request, Response } from "express";
import { UserService } from "../application/user.service";
import { UpdateUserSchema } from "../application/user.dto";

export class UserController {
  constructor(private userService: UserService) {}

  async getMe(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const user = await this.userService.getUserById(userId);
      res.json(user);
    } catch (error: any) {
      if (error.message === "User not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async updateMe(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      const validation = UpdateUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.format() });
      }

      const user = await this.userService.updateUser(userId, validation.data);
      res.json(user);
    } catch (error: any) {
      if (error.message === "User not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
