/**
 * Interface Layer - Organization Controller
 */

import { Request, Response } from "express";
import { OrganizationService } from "../application/organization.service";
import {
  successResponse,
  errorResponse,
} from "../../../shared/utils/response.util";
import { validation } from "../../../shared/utils/validate";
import { AppError } from "../../../shared/utils/app-error";
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  inviteUserSchema,
  acceptInvitationSchema,
  updateMemberRoleSchema,
} from "./validation";

export class OrganizationController {
  constructor(private organizationService: OrganizationService) {}

  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const data = req.body;
      validation(res, createOrganizationSchema as any, data);

      const organization = await this.organizationService.createOrganization(
        userId,
        data,
      );
      return successResponse(
        res,
        organization,
        201,
        "Organization created successfully",
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(res, err.statusCode, err.message);
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      validation(res, updateOrganizationSchema as any, data);

      const organization = await this.organizationService.updateOrganization(
        id,
        data,
      );
      return successResponse(
        res,
        organization,
        200,
        "Organization updated successfully",
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(res, err.statusCode, err.message);
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async invite(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      validation(res, inviteUserSchema as any, data);

      const invitation = await this.organizationService.inviteUser(id, data);
      return successResponse(
        res,
        invitation,
        201,
        "Invitation sent successfully",
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(res, err.statusCode, err.message);
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async acceptInvitation(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { token } = req.params;
      validation(res, acceptInvitationSchema as any, { token });

      await this.organizationService.acceptInvitation(token, userId);
      return successResponse(res, {}, 200, "Invitation accepted successfully");
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(res, err.statusCode, err.message);
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async listMembers(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const members = await this.organizationService.listMembers(id);
      return successResponse(
        res,
        members,
        200,
        "Members retrieved successfully",
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(res, err.statusCode, err.message);
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async updateMemberRole(req: Request, res: Response) {
    try {
      const { id, userId } = req.params;
      const data = req.body;
      validation(res, updateMemberRoleSchema as any, data);

      const member = await this.organizationService.updateMemberRole(
        id,
        userId,
        data,
      );
      return successResponse(
        res,
        member,
        200,
        "Member role updated successfully",
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(res, err.statusCode, err.message);
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }

  async removeMember(req: Request, res: Response) {
    try {
      const { id, userId } = req.params;
      await this.organizationService.removeMember(id, userId);
      return successResponse(res, {}, 200, "Member removed successfully");
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(res, err.statusCode, err.message);
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  }
}
