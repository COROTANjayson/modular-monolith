/**
 * User Module - Swagger/OpenAPI Documentation
 * 
 * This file contains all OpenAPI documentation for user management endpoints.
 * All response codes and schemas are aligned with ARCHITECTURE_GUIDE.md standards.
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *           description: User's unique identifier
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *           description: User's email address
 *         firstName:
 *           type: string
 *           nullable: true
 *           example: John
 *           description: User's first name
 *         lastName:
 *           type: string
 *           nullable: true
 *           example: Doe
 *           description: User's last name
 *         age:
 *           type: integer
 *           nullable: true
 *           minimum: 0
 *           example: 25
 *           description: User's age
 *         gender:
 *           type: string
 *           nullable: true
 *           example: male
 *           description: User's gender
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *           description: Account creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-02-08T12:30:00Z"
 *           description: Last update timestamp
 * 
 *     UpdateUserInput:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           minLength: 1
 *           example: John
 *           description: Updated first name
 *         lastName:
 *           type: string
 *           minLength: 1
 *           example: Doe
 *           description: Updated last name
 *         age:
 *           type: integer
 *           minimum: 0
 *           example: 26
 *           description: Updated age
 *         gender:
 *           type: string
 *           example: male
 *           description: Updated gender
 *       description: All fields are optional. Only provide fields you want to update.
 */

/**
 * @openapi
 * /api/v1/users/me:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get current user profile
 *     description: Retrieves the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User data retrieved successfully
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
 *                   example: USER_DATA_FETCHED
 *                 message:
 *                   type: string
 *                   example: User data retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *             example:
 *               success: true
 *               code: USER_DATA_FETCHED
 *               message: User data retrieved successfully
 *               data:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 email: user@example.com
 *                 firstName: John
 *                 lastName: Doe
 *                 age: 25
 *                 gender: male
 *                 createdAt: "2024-01-15T10:30:00Z"
 *                 updatedAt: "2024-02-08T12:30:00Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: ERROR_NOT_FOUND
 *               message: User not found
 *               errors: null
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /api/v1/users/me:
 *   patch:
 *     tags:
 *       - Users
 *     summary: Update current user profile
 *     description: Updates the authenticated user's profile information. All fields are optional - only include fields you want to update.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserInput'
 *           examples:
 *             updateName:
 *               summary: Update name only
 *               value:
 *                 firstName: John
 *                 lastName: Doe
 *             updateAge:
 *               summary: Update age only
 *               value:
 *                 age: 26
 *             updateAll:
 *               summary: Update all fields
 *               value:
 *                 firstName: John
 *                 lastName: Doe
 *                 age: 26
 *                 gender: male
 *     responses:
 *       200:
 *         description: User updated successfully
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
 *                   example: USER_DATA_UPDATED
 *                 message:
 *                   type: string
 *                   example: User updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *             example:
 *               success: true
 *               code: USER_DATA_UPDATED
 *               message: User updated successfully
 *               data:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 email: user@example.com
 *                 firstName: John
 *                 lastName: Doe
 *                 age: 26
 *                 gender: male
 *                 createdAt: "2024-01-15T10:30:00Z"
 *                 updatedAt: "2024-02-08T12:30:00Z"
 *       400:
 *         description: Validation Error - Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *             example:
 *               success: false
 *               code: ERROR_VALIDATION
 *               message: Validation failed
 *               errors:
 *                 - field: firstName
 *                   message: firstName must be at least 1 character
 *                 - field: age
 *                   message: age must be a positive integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: ERROR_NOT_FOUND
 *               message: User not found
 *               errors: null
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

// Export an empty object to make this a valid module
export {};
