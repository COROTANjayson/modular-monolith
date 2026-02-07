/**
 * Interface Layer - Organization Controller
 */

import { Request, Response } from "express";
import { OrganizationService } from "../application/organization.service";
import {
  successResponse,
  errorResponse,
} from "../../../shared/utils/response.util";
import { validate } from "../../../shared/utils/validate";
import { AppError } from "../../../shared/utils/app-error";
import {
  createOrganizationSchema,
  updateOrganizationSchema,
} from "./organization.validation";
import {
  SUCCESS_CODES,
  ERROR_CODES,
} from "../../../shared/utils/response-code";
import { ORG_SUCCESS_CODES } from "./organization.response-codes";

export class OrganizationController {
  constructor(private organizationService: OrganizationService) {}

  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const validatedData = validate(createOrganizationSchema, req.body);

      const organization = await this.organizationService.createOrganization(
        userId,
        validatedData,
      );
      return successResponse(
        res,
        organization,
        201,
        "Organization created successfully",
        ORG_SUCCESS_CODES.ORG_CREATED,
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

  async getAll(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const organizations =
        await this.organizationService.getUserOrganizations(userId);
      return successResponse(
        res,
        organizations,
        200,
        "Organizations retrieved successfully",
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
  
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;

      const organization = await this.organizationService.getOrganization(
        id,
        userId,
      );
      return successResponse(
        res,
        organization,
        200,
        "Organization retrieved successfully",
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

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = validate(updateOrganizationSchema, req.body);
      const userId = (req as any).userId;

      const organization = await this.organizationService.updateOrganization(
        id,
        validatedData,
        userId,
      );
      return successResponse(
        res,
        organization,
        200,
        "Organization updated successfully",
        ORG_SUCCESS_CODES.ORG_UPDATED,
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
