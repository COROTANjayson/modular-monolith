/**
 * Auth Module - Swagger/OpenAPI Documentation
 * 
 * This file contains all OpenAPI documentation for authentication endpoints.
 * All response codes and schemas are aligned with ARCHITECTURE_GUIDE.md standards.
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     RegisterInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *           description: User's email address
 *         password:
 *           type: string
 *           minLength: 6
 *           example: password123
 *           description: User's password (minimum 6 characters)
 * 
 *     LoginInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           minLength: 6
 *           example: password123
 * 
 *     AuthTokens:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *           description: JWT access token
 *         refreshToken:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *           description: JWT refresh token (also set in httpOnly cookie)
 * 
 *     UserData:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         email:
 *           type: string
 *           example: user@example.com
 *         isVerified:
 *           type: boolean
 *           example: false
 * 
 *     RegisterOutput:
 *       allOf:
 *         - $ref: '#/components/schemas/AuthTokens'
 *         - $ref: '#/components/schemas/UserData'
 * 
 *     LoginOutput:
 *       allOf:
 *         - $ref: '#/components/schemas/AuthTokens'
 *         - type: object
 *           properties:
 *             csrfToken:
 *               type: string
 *               example: csrf-token-value
 *               description: CSRF token (also set in cookie)
 * 
 *     VerifyEmailInput:
 *       type: object
 *       required:
 *         - token
 *       properties:
 *         token:
 *           type: string
 *           minLength: 1
 *           example: verification-token-here
 *           description: Email verification token
 * 
 *     ResendVerificationInput:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 * 
 *     UpdatePasswordInput:
 *       type: object
 *       required:
 *         - oldPassword
 *         - newPassword
 *       properties:
 *         oldPassword:
 *           type: string
 *           minLength: 6
 *           example: oldpassword123
 *         newPassword:
 *           type: string
 *           minLength: 6
 *           example: newpassword123
 *           description: Must be different from old password
 */

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Creates a new user account and sends a verification email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 code:
 *                   type: string
 *                   example: AUTH_REGISTER_SUCCESS
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 data:
 *                   $ref: '#/components/schemas/RegisterOutput'
 *       400:
 *         description: Validation Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             example:
 *               success: false
 *               code: ERROR_VALIDATION
 *               message: Validation failed
 *               errors:
 *                 - field: email
 *                   message: Invalid email format
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: AUTH_EMAIL_EXISTS
 *               message: Email already exists
 *               errors: null
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login user
 *     description: Authenticates a user and returns access/refresh tokens. Sets refresh token and CSRF token in httpOnly cookies.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: Sets refreshToken and csrf-token cookies
 *             schema:
 *               type: string
 *               example: refreshToken=eyJhbGc...; HttpOnly; Secure; SameSite=Strict
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 code:
 *                   type: string
 *                   example: AUTH_LOGIN_SUCCESS
 *                 message:
 *                   type: string
 *                   example: Login Success
 *                 data:
 *                   $ref: '#/components/schemas/LoginOutput'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: AUTH_INVALID_CREDENTIALS
 *               message: Invalid email or password
 *               errors: null
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token
 *     description: Uses the refresh token from cookies to generate a new access token. Rotates CSRF token.
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         headers:
 *           Set-Cookie:
 *             description: Rotates csrf-token cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 code:
 *                   type: string
 *                   example: AUTH_TOKEN_REFRESH_SUCCESS
 *                 message:
 *                   type: string
 *                   example: Token Refresh
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Missing or invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: AUTH_INVALID_TOKEN
 *               message: refreshToken required
 *               errors: null
 *       401:
 *         description: Token expired or invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: AUTH_TOKEN_EXPIRED
 *               message: Refresh token expired
 *               errors: null
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Logout user
 *     description: Invalidates the refresh token and clears authentication cookies
 *     responses:
 *       200:
 *         description: Logout successful
 *         headers:
 *           Set-Cookie:
 *             description: Clears refreshToken and csrf-token cookies
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 code:
 *                   type: string
 *                   example: AUTH_LOGOUT_SUCCESS
 *                 message:
 *                   type: string
 *                   example: Logout
 *                 data:
 *                   type: object
 *                   example: {}
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /api/v1/auth/verify-email:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Verify email address
 *     description: Verifies a user's email address using the verification token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyEmailInput'
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 code:
 *                   type: string
 *                   example: AUTH_EMAIL_VERIFIED
 *                 message:
 *                   type: string
 *                   example: Email verified
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: AUTH_INVALID_TOKEN
 *               message: Invalid verification token
 *               errors: null
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /api/v1/auth/resend-verification:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Resend verification email
 *     description: Sends a new verification email to the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResendVerificationInput'
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 code:
 *                   type: string
 *                   example: AUTH_VERIFICATION_SENT
 *                 message:
 *                   type: string
 *                   example: Verification email sent
 *                 data:
 *                   type: object
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: AUTH_USER_NOT_FOUND
 *               message: User not found
 *               errors: null
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /api/v1/auth/password:
 *   patch:
 *     tags:
 *       - Authentication
 *     summary: Update password
 *     description: Updates the authenticated user's password (requires valid access token)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePasswordInput'
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 code:
 *                   type: string
 *                   example: AUTH_PASSWORD_UPDATED
 *                 message:
 *                   type: string
 *                   example: Password updated successfully
 *                 data:
 *                   type: object
 *                   example: {}
 *       400:
 *         description: Validation error or new password same as old
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               validation:
 *                 value:
 *                   success: false
 *                   code: ERROR_VALIDATION
 *                   message: Validation failed
 *                   errors:
 *                     - field: newPassword
 *                       message: New password cannot be the same as the old password
 *               invalidOldPassword:
 *                 value:
 *                   success: false
 *                   code: AUTH_INVALID_PASSWORD
 *                   message: Invalid old password
 *                   errors: null
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

// Export an empty object to make this a valid module
export {};
