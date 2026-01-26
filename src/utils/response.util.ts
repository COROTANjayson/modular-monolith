// src/utils/response.util.ts

import { Response } from "express";

interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  success: boolean;
  errors?: any;
}

export const successResponse = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  message = "Success"
) => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  statusCode = 500,
  message = "Something went wrong",
  errors?: any
) => {
  const response: ApiResponse = {
    success: false,
    message,
    errors,
  };
  return res.status(statusCode).json(response);
};
