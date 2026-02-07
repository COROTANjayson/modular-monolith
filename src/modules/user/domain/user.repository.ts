/**
 * Domain Layer - User Repository Port
 */

import { User, UserUpdateData } from "./user.entity";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(id: string, data: UserUpdateData): Promise<User>;
}
