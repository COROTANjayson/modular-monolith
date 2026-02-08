/**
 * Organization Module - Swagger/OpenAPI Documentation
 * 
 * This file contains all OpenAPI documentation for organization management endpoints.
 * All response codes and schemas are aligned with ARCHITECTURE_GUIDE.md standards.
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     Organization:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *           description: Organization's unique identifier
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *           example: Acme Corporation
 *           description: Organization name
 *         slug:
 *           type: string
 *           example: acme-corporation
 *           description: URL-friendly organization identifier
 *         ownerId:
 *           type: string
 *           format: uuid
 *           example: "660e8400-e29b-41d4-a716-446655440001"
 *           description: User ID of the organization owner
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *           description: Organization creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-02-08T12:30:00Z"
 *           description: Last update timestamp
 * 
 *     CreateOrganizationInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *           example: Acme Corporation
 *           description: Organization name
 * 
 *     UpdateOrganizationInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *           example: Acme Inc
 *           description: Updated organization name
 *       description: All fields are optional
 */

/**
 * @openapi
 * /api/v1/organizations:
 *   get:
 *     tags:
 *       - Organizations
 *     summary: Get all user organizations
 *     description: Retrieves all organizations where the authenticated user is a member
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organizations retrieved successfully
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
 *                   example: SUCCESS_FETCHED
 *                 message:
 *                   type: string
 *                   example: Organizations retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Organization'
 *             example:
 *               success: true
 *               code: SUCCESS_FETCHED
 *               message: Organizations retrieved successfully
 *               data:
 *                 - id: "550e8400-e29b-41d4-a716-446655440000"
 *                   name: Acme Corporation
 *                   slug: acme-corporation
 *                   ownerId: "660e8400-e29b-41d4-a716-446655440001"
 *                   createdAt: "2024-01-15T10:30:00Z"
 *                   updatedAt: "2024-02-08T12:30:00Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /api/v1/organizations:
 *   post:
 *     tags:
 *       - Organizations
 *     summary: Create a new organization
 *     description: Creates a new organization with the authenticated user as owner
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrganizationInput'
 *     responses:
 *       201:
 *         description: Organization created successfully
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
 *                   example: ORG_CREATED
 *                 message:
 *                   type: string
 *                   example: Organization created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Organization'
 *             example:
 *               success: true
 *               code: ORG_CREATED
 *               message: Organization created successfully
 *               data:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 name: Acme Corporation
 *                 slug: acme-corporation
 *                 ownerId: "660e8400-e29b-41d4-a716-446655440001"
 *                 createdAt: "2024-01-15T10:30:00Z"
 *                 updatedAt: "2024-01-15T10:30:00Z"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /api/v1/organizations/{id}:
 *   get:
 *     tags:
 *       - Organizations
 *     summary: Get organization by ID
 *     description: Retrieves a specific organization. User must be a member of the organization.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Organization retrieved successfully
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
 *                   example: SUCCESS_FETCHED
 *                 message:
 *                   type: string
 *                   example: Organization retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Organization'
 *             example:
 *               success: true
 *               code: SUCCESS_FETCHED
 *               message: Organization retrieved successfully
 *               data:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 name: Acme Corporation
 *                 slug: acme-corporation
 *                 ownerId: "660e8400-e29b-41d4-a716-446655440001"
 *                 createdAt: "2024-01-15T10:30:00Z"
 *                 updatedAt: "2024-02-08T12:30:00Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - User is not a member of this organization
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: ERROR_FORBIDDEN
 *               message: Access denied
 *               errors: null
 *       404:
 *         description: Organization not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: ORG_NOT_FOUND
 *               message: Organization not found
 *               errors: null
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /api/v1/organizations/{id}:
 *   patch:
 *     tags:
 *       - Organizations
 *     summary: Update organization
 *     description: Updates an organization. User must have OWNER or ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOrganizationInput'
 *     responses:
 *       200:
 *         description: Organization updated successfully
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
 *                   example: ORG_UPDATED
 *                 message:
 *                   type: string
 *                   example: Organization updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Organization'
 *             example:
 *               success: true
 *               code: ORG_UPDATED
 *               message: Organization updated successfully
 *               data:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 name: Acme Inc
 *                 slug: acme-corporation
 *                 ownerId: "660e8400-e29b-41d4-a716-446655440001"
 *                 createdAt: "2024-01-15T10:30:00Z"
 *                 updatedAt: "2024-02-08T13:30:00Z"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - User does not have permission to update
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: ERROR_FORBIDDEN
 *               message: Insufficient permissions
 *               errors: null
 *       404:
 *         description: Organization not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: ORG_NOT_FOUND
 *               message: Organization not found
 *               errors: null
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

// Export an empty object to make this a valid module
export {};
