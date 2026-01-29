import { ErrorCode } from "./response-code";

export class AppError extends Error {
  public statusCode: number;
  public code?: ErrorCode;
  public errors?: any;

  constructor(
    message: string,
    statusCode = 400,
    code?: ErrorCode,
    errors?: any,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
  }
}
