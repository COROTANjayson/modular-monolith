import { ErrorCode } from "./response-code";

export class AppError extends Error {
  public statusCode: number;
  public code?: ErrorCode;

  constructor(message: string, statusCode = 400, code?: ErrorCode) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}
