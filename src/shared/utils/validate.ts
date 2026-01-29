// src/app/middleware/validate.middleware.ts
import { ZodObject, ZodError } from "zod";
import { Response } from "express";
import { errorResponse } from "../utils/response.util";
import { ERROR_CODES } from "./response-code";

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
