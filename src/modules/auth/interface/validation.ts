/**
 * Interface Layer - Request Validation Schemas
 * Zod schemas for HTTP request validation
 */

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
    email: z.string().email(),
    password: z.string().min(6),
  })
  .strict();

export const verifyEmailSchema = z
  .object({
    token: z.string().min(1),
  })
  .strict();

export const resendVerificationSchema = z
  .object({
    email: z.string().email(),
  })
  .strict();
