/**
 * Interface Layer - Member Controller
 */

import { Request, Response } from "express";
import { MemberService } from "../application/member.service";
import {
  successResponse,
  errorResponse,
} from "../../../shared/utils/response.util";
import { validation } from "../../../shared/utils/validate";
import { AppError } from "../../../shared/utils/app-error";
import {
  inviteUserSchema,
  acceptInvitationSchema,
  updateMemberRoleSchema,
} from "./validation";
import {
  SUCCESS_CODES,
  ERROR_CODES,
} from "../../../shared/utils/response-code";

export class MemberController {
  constructor(private memberService: MemberService) {}

  async invite(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      validation(res, inviteUserSchema as any, data);

      const invitation = await this.memberService.inviteUser(id, data);
      return successResponse(
        res,
        invitation,
        201,
        "Invitation sent successfully",
        SUCCESS_CODES.ORG_INVITATION_SENT,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(res, err.statusCode, err.message, null, err.code);
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async acceptInvitation(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { token } = req.params;
      validation(res, acceptInvitationSchema as any, { token });

      await this.memberService.acceptInvitation(token, userId);
      return successResponse(
        res,
        {},
        200,
        "Invitation accepted successfully",
        SUCCESS_CODES.ORG_INVITATION_ACCEPTED,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(res, err.statusCode, err.message, null, err.code);
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async listMembers(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const members = await this.memberService.listMembers(id);
      return successResponse(
        res,
        members,
        200,
        "Members retrieved successfully",
        SUCCESS_CODES.FETCHED,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(res, err.statusCode, err.message, null, err.code);
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async updateMemberRole(req: Request, res: Response) {
    try {
      const { id, userId } = req.params;
      const data = req.body;
      validation(res, updateMemberRoleSchema as any, data);

      const member = await this.memberService.updateMemberRole(
        id,
        userId,
        data,
      );
      return successResponse(
        res,
        member,
        200,
        "Member role updated successfully",
        SUCCESS_CODES.ORG_MEMBER_ROLE_UPDATED,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(res, err.statusCode, err.message, null, err.code);
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async removeMember(req: Request, res: Response) {
    try {
      const { id, userId } = req.params;
      await this.memberService.removeMember(id, userId);
      return successResponse(
        res,
        {},
        200,
        "Member removed successfully",
        SUCCESS_CODES.ORG_MEMBER_REMOVED,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(res, err.statusCode, err.message, null, err.code);
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }
}
