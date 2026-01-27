/**
 * Application Layer - DTOs
 */

import { z } from "zod";

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  age: z.number().int().min(0).optional(),
  gender: z.string().optional(),
});

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
