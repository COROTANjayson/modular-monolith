/**
 * Application Layer - User Service
 */

import { IUserRepository } from "./ports";
import { UpdateUserDto } from "./user.dto";
import { User } from "../domain/user.entity";

export class UserService {
  constructor(private userRepository: IUserRepository) {}

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    // Check if user exists
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error("User not found");
    }

    return this.userRepository.update(id, data);
  }
}
