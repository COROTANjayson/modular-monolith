/**
 * Application Layer - User Service
 */

import { IUserRepository } from "../domain/user.repository";
import { UpdateUserDto } from "./user.dto";
import { User } from "../domain/user.entity";
import { AppError } from "../../../shared/utils/app-error";

export class UserService {
  constructor(private userRepository: IUserRepository) {}

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    // Check if user exists
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    return this.userRepository.update(id, data);
  }
}
