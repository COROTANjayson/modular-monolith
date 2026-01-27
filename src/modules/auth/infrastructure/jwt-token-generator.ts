import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { ITokenGenerator } from "../application/ports";
import {
  ACCESS_SECRET,
  ACCESS_EXPIRES,
  REFRESH_SECRET,
  REFRESH_EXPIRES,
} from "../../../utils/config";

export class JwtTokenGenerator implements ITokenGenerator {
  generateAccessToken(payload: { id: string; email: string }): string {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
  }

  generateRefreshToken(payload: {
    id: string;
    email: string;
    jti: string;
  }): string {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
  }

  verifyRefreshToken(token: string): {
    id: string;
    email: string;
    jti: string;
  } {
    try {
      const decoded = jwt.verify(token, REFRESH_SECRET) as any;
      return {
        id: decoded.id,
        email: decoded.email,
        jti: decoded.jti,
      };
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  generateUUID(): string {
    return uuidv4();
  }
}
