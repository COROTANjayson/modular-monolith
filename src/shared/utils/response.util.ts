// src/utils/response.util.ts

import { Response } from "express";
import {
  ERROR_CODES,
  SUCCESS_CODES,
  SuccessCode,
  ErrorCode,
} from "./response-code";

interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  success: boolean;
  code: string;
  errors?: any;
}

export const successResponse = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  message = "Success",
  code: SuccessCode = SUCCESS_CODES.DEFAULT,
) => {
  const response: ApiResponse<T> = {
    success: true,
    code,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  statusCode = 500,
  message = "Something went wrong",
  errors?: any,
  code: ErrorCode = ERROR_CODES.DEFAULT,
) => {
  const response: ApiResponse = {
    success: false,
    code,
    message,
    errors,
  };
  return res.status(statusCode).json(response);
};
