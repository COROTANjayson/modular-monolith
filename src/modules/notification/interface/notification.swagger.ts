/**
 * Notification Module - Swagger/OpenAPI Documentation
 *
 * This file contains all OpenAPI documentation for notification management endpoints.
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *           description: Notification unique identifier
 *         userId:
 *           type: string
 *           format: uuid
 *           example: "660e8400-e29b-41d4-a716-446655440001"
 *           description: Recipient user ID
 *         type:
 *           type: string
 *           example: "MEMBER_INVITE"
 *           description: Type of notification
 *         title:
 *           type: string
 *           example: "Organization Invitation"
 *           description: Notification title
 *         message:
 *           type: string
 *           example: "You have been invited to join Acme Corp"
 *           description: Notification body message
 *         metadata:
 *           type: object
 *           nullable: true
 *           description: flexible JSON payload
 *           example:
 *             organizationId: "org-123"
 *             role: "MEMBER"
 *         isRead:
 *           type: boolean
 *           example: false
 *           description: Read status
 *         readAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 *           description: Timestamp when read
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-02-12T10:30:00Z"
 *           description: Creation timestamp
 *
 *     NotificationListResponse:
 *       type: object
 *       properties:
 *         notifications:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Notification'
 *         total:
 *           type: integer
 *           example: 5
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 20
 *         totalPages:
 *           type: integer
 *           example: 1
 */

/**
 * @openapi
 * /api/v1/notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get user notifications
 *     description: Retrieves paginated notifications for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - name: isRead
 *         in: query
 *         schema:
 *           type: boolean
 *         description: Filter by read status (true/false)
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
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
 *                   example: NOTIF_FETCHED
 *                 message:
 *                   type: string
 *                   example: Notifications retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/NotificationListResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /api/v1/notifications/unread-count:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get unread count
 *     description: Retrieves the total count of unread notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved
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
 *                   example: NOTIF_UNREAD_COUNT
 *                 message:
 *                   type: string
 *                   example: Unread count retrieved
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 3
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /api/v1/notifications/read-all:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: Mark all as read
 *     description: Marks all unread notifications for the user as read
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
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
 *                   example: NOTIF_ALL_MARKED_READ
 *                 message:
 *                   type: string
 *                   example: All notifications marked as read
 *                 data:
 *                   type: null
 *                   example: null
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /api/v1/notifications/{id}/read:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: Mark single notification as read
 *     description: Marks a specific notification as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
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
 *                   example: NOTIF_MARKED_READ
 *                 message:
 *                   type: string
 *                   example: Notification marked as read
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Notification not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: NOTIF_NOT_FOUND
 *               message: Notification not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /api/v1/notifications/{id}:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: Delete notification
 *     description: Deletes a specific notification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted
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
 *                   example: NOTIF_DELETED
 *                 message:
 *                   type: string
 *                   example: Notification deleted
 *                 data:
 *                   type: null
 *                   example: null
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Notification not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: NOTIF_NOT_FOUND
 *               message: Notification not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

// Export an empty object to make this a valid module
export {};
