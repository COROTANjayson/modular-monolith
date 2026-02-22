/**
 * Team Module - Swagger/OpenAPI Documentation
 *
 * All response codes and schemas are aligned with ARCHITECTURE_GUIDE.md standards.
 * Responses follow the standard envelope: { success, code, message, data/errors }
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     Team:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         organizationId:
 *           type: string
 *           format: uuid
 *           example: "org-123"
 *         name:
 *           type: string
 *           example: "Engineering"
 *         description:
 *           type: string
 *           nullable: true
 *           example: "The engineering team"
 *         leaderId:
 *           type: string
 *           format: uuid
 *           example: "user-123"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         leader:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             firstName:
 *               type: string
 *               nullable: true
 *             lastName:
 *               type: string
 *               nullable: true
 *             email:
 *               type: string
 *             avatar:
 *               type: string
 *               nullable: true
 *         _count:
 *           type: object
 *           properties:
 *             members:
 *               type: integer
 *
 *     CreateTeamInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *         description:
 *           type: string
 *           maxLength: 255
 *         memberIds:
 *           type: array
 *           description: Optional list of user IDs to add as initial team members
 *           maxItems: 50
 *           items:
 *             type: string
 *             format: uuid
 *
 *     UpdateTeamInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *         description:
 *           type: string
 *           maxLength: 255
 *
 *     AddTeamMembersInput:
 *       type: object
 *       required:
 *         - userIds
 *       properties:
 *         userIds:
 *           type: array
 *           description: List of user IDs to add to the team
 *           minItems: 1
 *           maxItems: 50
 *           items:
 *             type: string
 *             format: uuid
 *
 *     AddTeamMembersResult:
 *       type: object
 *       properties:
 *         added:
 *           type: array
 *           description: Members that were successfully added
 *           items:
 *             $ref: '#/components/schemas/TeamMember'
 *         skipped:
 *           type: array
 *           description: User IDs that were skipped (already members or not in org)
 *           items:
 *             type: string
 *             format: uuid
 *
 *     TeamMember:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         teamId:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         joinedAt:
 *           type: string
 *           format: date-time
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             firstName:
 *               type: string
 *               nullable: true
 *             lastName:
 *               type: string
 *               nullable: true
 *             email:
 *               type: string
 *             avatar:
 *               type: string
 *               nullable: true
 */

/**
 * @openapi
 * /api/v1/organizations/{organizationId}/teams:
 *   post:
 *     tags:
 *       - Teams
 *     summary: Create a new team
 *     description: Creates a new team within the organization. Only OWNER, ADMIN, or TEAM_LEAD roles can create teams. The creator becomes the team leader automatically.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTeamInput'
 *     responses:
 *       201:
 *         description: Team created successfully
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
 *                   example: TEAM_CREATED
 *                 message:
 *                   type: string
 *                   example: Team created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Team'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Insufficient permissions to create a team
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: ERROR_FORBIDDEN
 *               message: Insufficient permissions to create a team
 *               errors: null
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   get:
 *     tags:
 *       - Teams
 *     summary: List all teams in an organization
 *     description: Retrieves all teams within the specified organization.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Teams retrieved successfully
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
 *                   example: TEAMS_FETCHED
 *                 message:
 *                   type: string
 *                   example: Teams retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Team'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /api/v1/organizations/{organizationId}/teams/mine:
 *   get:
 *     tags:
 *       - Teams
 *     summary: Get my teams
 *     description: Retrieves all teams that the authenticated user belongs to within the specified organization.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Your teams retrieved successfully
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
 *                   example: MY_TEAMS_FETCHED
 *                 message:
 *                   type: string
 *                   example: Your teams retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Team'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /api/v1/organizations/{organizationId}/teams/{teamId}:
 *   get:
 *     tags:
 *       - Teams
 *     summary: Get team details
 *     description: Retrieves details for a specific team. User must be a member of the team, the team leader, or an organization admin/owner.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team retrieved successfully
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
 *                   example: TEAM_FETCHED
 *                 message:
 *                   type: string
 *                   example: Team retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Team'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - User is not a member of this team
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: ERROR_FORBIDDEN
 *               message: Access denied. You must be a member of the team or an admin to view details
 *               errors: null
 *       404:
 *         description: Team not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: TEAM_NOT_FOUND
 *               message: Team not found
 *               errors: null
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   patch:
 *     tags:
 *       - Teams
 *     summary: Update team details
 *     description: Updates a team's name and/or description. Only the team leader can update team details.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTeamInput'
 *     responses:
 *       200:
 *         description: Team updated successfully
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
 *                   example: TEAM_UPDATED
 *                 message:
 *                   type: string
 *                   example: Team updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Team'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Only the team leader can update team details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: ERROR_FORBIDDEN
 *               message: Only the team leader can update team details
 *               errors: null
 *       404:
 *         description: Team not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: TEAM_NOT_FOUND
 *               message: Team not found
 *               errors: null
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /api/v1/organizations/{organizationId}/teams/{teamId}/members:
 *   get:
 *     tags:
 *       - Teams
 *     summary: List team members
 *     description: Retrieves all members of a specific team. Accessible to any organization member.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team members retrieved successfully
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
 *                   example: TEAM_MEMBERS_FETCHED
 *                 message:
 *                   type: string
 *                   example: Team members retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TeamMember'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Team not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: TEAM_NOT_FOUND
 *               message: Team not found
 *               errors: null
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   post:
 *     tags:
 *       - Teams
 *     summary: Add members to team (bulk)
 *     description: Adds one or more users to a team. Only OWNER, ADMIN, or the team leader can add members. Target users must be organization members. Duplicates and non-org members are skipped.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddTeamMembersInput'
 *     responses:
 *       201:
 *         description: Members added to team successfully
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
 *                   example: TEAM_MEMBERS_ADDED
 *                 message:
 *                   type: string
 *                   example: Members added to team successfully
 *                 data:
 *                   $ref: '#/components/schemas/AddTeamMembersResult'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Insufficient permissions to add members
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: ERROR_FORBIDDEN
 *               message: Insufficient permissions to add members to this team
 *               errors: null
 *       404:
 *         description: Team not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: TEAM_NOT_FOUND
 *               message: Team not found
 *               errors: null
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @openapi
 * /api/v1/organizations/{organizationId}/teams/{teamId}/members/{userId}:
 *   delete:
 *     tags:
 *       - Teams
 *     summary: Remove member from team
 *     description: Removes a user from a team. Only OWNER, ADMIN, or the team leader can remove members. The team leader cannot be removed.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization ID
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Team ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the user to remove
 *     responses:
 *       204:
 *         description: Member removed from team successfully
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
 *                   example: TEAM_MEMBER_REMOVED
 *                 message:
 *                   type: string
 *                   example: Member removed from team successfully
 *                 data:
 *                   type: "null"
 *                   example: null
 *       400:
 *         description: Bad request - Cannot remove the team leader
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: ERROR_BAD_REQUEST
 *               message: Cannot remove the team leader
 *               errors: null
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Insufficient permissions to remove members
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: ERROR_FORBIDDEN
 *               message: Insufficient permissions to remove members from this team
 *               errors: null
 *       404:
 *         description: Team not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               code: TEAM_NOT_FOUND
 *               message: Team not found
 *               errors: null
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

// Export an empty object to make this a valid module
export {};
