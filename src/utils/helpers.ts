import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";

export const generateToken = (
  payload: any,
  secret: string,
  expiresIn: any = "1d"
) => {
  return jwt.sign(payload, secret, { expiresIn });
};
export const generateHash = (password: string) => {
  return bcrypt.hash(password, 10);
};
export const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const signCsrfToken = (token: string, secret: string) => {
  const hmac = crypto.createHmac("sha256", secret).update(token).digest("hex");
  return `${token}.${hmac}`;
};

export const verifyCsrfToken = (signedToken: string, secret: string) => {
  if (!signedToken || typeof signedToken !== "string") return false;
  const [token, hmac] = signedToken.split(".");
  if (!token || !hmac) return false;

  const validHmac = crypto
    .createHmac("sha256", secret)
    .update(token)
    .digest("hex");

  const hmacBuffer = Buffer.from(hmac);
  const validHmacBuffer = Buffer.from(validHmac);

  if (hmacBuffer.length !== validHmacBuffer.length) return false;
  return crypto.timingSafeEqual(hmacBuffer, validHmacBuffer);
};
