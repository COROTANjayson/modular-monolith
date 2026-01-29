import { ZodObject, ZodSchema } from "zod";
import { Response } from "express";
import { errorResponse } from "../utils/response.util";
import { ERROR_CODES } from "./response-code";
import { AppError } from "./app-error";

/**
 * Validates data against a schema and returns the cleaned data.
 * Throws AppError if validation fails.
 */
export const validate = <T>(schema: ZodSchema<T>, data: any): T => {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    throw new AppError(
      "Validation error",
      400,
      ERROR_CODES.VALIDATION_ERROR,
      errors,
    );
  }

  return result.data;
};

// Legacy version - should be avoided as it doesn't return cleaned data
export const validation = (
  res: Response,
  schema: ZodObject<any>,
  data: any,
) => {
  const result = schema.safeParse(data);

  if (!result.success) {
    return errorResponse(
      res,
      400,
      "Validation error",
      result.error.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
      ERROR_CODES.VALIDATION_ERROR,
    );
  }
};
