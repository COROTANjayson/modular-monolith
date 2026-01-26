import { z } from "zod";

export const registerSchema = z
  .object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    age: z.number().int().positive().optional(),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.email(),
    password: z.string().min(6),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
