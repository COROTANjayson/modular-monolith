/**
 * Interface Layer - Member Controller
 */

import { Request, Response } from "express";
import { MemberService } from "../application/member.service";
import {
  successResponse,
  errorResponse,
} from "../../../shared/utils/response.util";
import { validate } from "../../../shared/utils/validate";
import { AppError } from "../../../shared/utils/app-error";
import {
  inviteUserSchema,
  acceptInvitationSchema,
  updateMemberRoleSchema,
  updateMemberStatusSchema,
} from "./member.validation";
import { OrganizationRole } from "../domain/member.entity";
import {
  SUCCESS_CODES,
  ERROR_CODES,
} from "../../../shared/utils/response-code";
import { ORG_SUCCESS_CODES } from "./organization.response-codes";

export class MemberController {
  constructor(private memberService: MemberService) {}

  async invite(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = validate(inviteUserSchema, req.body);
      const userId = (req as any).userId;

      const invitation = await this.memberService.inviteUser(
        id,
        validatedData,
        userId,
      );
      return successResponse(
        res,
        invitation,
        201,
        "Invitation sent successfully",
        ORG_SUCCESS_CODES.ORG_INVITATION_SENT,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(
          res,
          err.statusCode,
          err.message,
          err.errors,
          err.code,
        );
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async acceptInvitation(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { token } = req.params;
      const validatedData = validate(acceptInvitationSchema, { token });

      await this.memberService.acceptInvitation(validatedData.token, userId);
      return successResponse(
        res,
        {},
        200,
        "Invitation accepted successfully",
        ORG_SUCCESS_CODES.ORG_INVITATION_ACCEPTED,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(
          res,
          err.statusCode,
          err.message,
          err.errors,
          err.code,
        );
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async getInvitation(req: Request, res: Response) {
    try {
      const { token } = req.params;
      const result = await this.memberService.getInvitationByToken(token);
      return successResponse(
        res,
        result,
        200,
        "Invitation details retrieved",
        SUCCESS_CODES.FETCHED,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(
          res,
          err.statusCode,
          err.message,
          err.errors,
          err.code,
        );
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async listMembers(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;
      const members = await this.memberService.listMembers(id, userId);
      return successResponse(
        res,
        members,
        200,
        "Members retrieved successfully",
        ORG_SUCCESS_CODES.ORG_MEMBERS_FETCHED,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(
          res,
          err.statusCode,
          err.message,
          err.errors,
          err.code,
        );
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async getMe(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;
      const member = await this.memberService.getCurrentMember(id, userId);
      return successResponse(
        res,
        member,
        200,
        "Current member retrieved successfully",
        SUCCESS_CODES.FETCHED,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(
          res,
          err.statusCode,
          err.message,
          err.errors,
          err.code,
        );
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async updateMemberRole(req: Request, res: Response) {
    try {
      const { id, userId } = req.params;
      const validatedData = validate(updateMemberRoleSchema, req.body);
      const currentUserId = (req as any).userId;

      const member = await this.memberService.updateMemberRole(
        id,
        userId,
        validatedData,
        currentUserId,
      );
      return successResponse(
        res,
        member,
        200,
        "Member role updated successfully",
        ORG_SUCCESS_CODES.ORG_MEMBER_ROLE_UPDATED,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(
          res,
          err.statusCode,
          err.message,
          err.errors,
          err.code,
        );
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async removeMember(req: Request, res: Response) {
    try {
      const { id, userId } = req.params;
      const currentUserId = (req as any).userId;
      await this.memberService.removeMember(id, userId, currentUserId);
      return successResponse(
        res,
        {},
        200,
        "Member removed successfully",
        ORG_SUCCESS_CODES.ORG_MEMBER_REMOVED,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(
          res,
          err.statusCode,
          err.message,
          err.errors,
          err.code,
        );
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async listInvitations(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;
      const invitations = await this.memberService.listInvitations(id, userId);
      return successResponse(
        res,
        invitations,
        200,
        "Invitations retrieved successfully",
        ORG_SUCCESS_CODES.ORG_INVITATIONS_FETCHED,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(
          res,
          err.statusCode,
          err.message,
          err.errors,
          err.code,
        );
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async revokeInvitation(req: Request, res: Response) {
    try {
      const { id, invitationId } = req.params;
      const userId = (req as any).userId;
      await this.memberService.revokeInvitation(id, invitationId, userId);
      return successResponse(
        res,
        {},
        200,
        "Invitation revoked successfully",
        ORG_SUCCESS_CODES.ORG_INVITATION_REVOKED,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(
          res,
          err.statusCode,
          err.message,
          err.errors,
          err.code,
        );
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async updateMemberStatus(req: Request, res: Response) {
    try {
      const { id, userId } = req.params;
      const validatedData = validate(updateMemberStatusSchema, req.body);
      const currentUserId = (req as any).userId;

      const member = await this.memberService.updateMemberStatus(
        id,
        userId,
        validatedData.status,
        currentUserId,
      );
      return successResponse(
        res,
        member,
        200,
        "Member status updated successfully",
        ORG_SUCCESS_CODES.ORG_MEMBER_STATUS_UPDATED,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(
          res,
          err.statusCode,
          err.message,
          err.errors,
          err.code,
        );
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }
}
