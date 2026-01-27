/**
 * Application Layer - Ports
 * Interfaces for infrastructure implementations
 */

import { User, UserUpdateData } from "../domain/user.entity";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  update(id: string, data: UserUpdateData): Promise<User>;
}
