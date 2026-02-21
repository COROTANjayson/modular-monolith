
import { Request, Response, NextFunction } from "express";
import { TeamService } from "../application/team.service";
import {
  successResponse,
  errorResponse,
} from "../../../shared/utils/response.util";
import { AppError } from "../../../shared/utils/app-error";
import { ORG_SUCCESS_CODES } from "./organization.response-codes";

export class TeamController {
  constructor(private teamService: TeamService) {}

  createTeam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId } = req.params;
      const userId = (req as any).userId;
      const { name, description } = req.body;

      const team = await this.teamService.createTeam(organizationId, userId, {
        name,
        description,
      });

      return successResponse(
        res,
        team,
        201,
        "Team created successfully",
        ORG_SUCCESS_CODES.TEAM_CREATED,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(res, err.statusCode, err.message, err.errors, err.code);
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  };

  updateTeam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId, teamId } = req.params;
      const userId = (req as any).userId;
      const { name, description } = req.body;

      const team = await this.teamService.updateTeam(
        organizationId,
        userId,
        teamId,
        { name, description }
      );

      return successResponse(
        res,
        team,
        200,
        "Team updated successfully",
        ORG_SUCCESS_CODES.TEAM_UPDATED,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(res, err.statusCode, err.message, err.errors, err.code);
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  };

  addMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId, teamId } = req.params;
      const actorId = (req as any).userId;
      const { userId } = req.body;

      const member = await this.teamService.addMember(
        organizationId,
        actorId,
        teamId,
        userId
      );

      return successResponse(
        res,
        member,
        201,
        "Member added to team successfully",
        ORG_SUCCESS_CODES.TEAM_MEMBER_ADDED,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(res, err.statusCode, err.message, err.errors, err.code);
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  };

  removeMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId, teamId, userId } = req.params;
      const actorId = (req as any).userId;

      await this.teamService.removeMember(organizationId, actorId, teamId, userId);

      return successResponse(
        res,
        null,
        204,
        "Member removed from team successfully",
        ORG_SUCCESS_CODES.TEAM_MEMBER_REMOVED,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(res, err.statusCode, err.message, err.errors, err.code);
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  };

  getTeam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId, teamId } = req.params;
      const userId = (req as any).userId;

      const team = await this.teamService.getTeam(organizationId, userId, teamId);

      return successResponse(
        res,
        team,
        200,
        "Team retrieved successfully",
        ORG_SUCCESS_CODES.TEAM_FETCHED,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(res, err.statusCode, err.message, err.errors, err.code);
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  };

  getTeams = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId } = req.params;
      const userId = (req as any).userId;

      const teams = await this.teamService.getTeams(organizationId, userId);

      return successResponse(
        res,
        teams,
        200,
        "Teams retrieved successfully",
        ORG_SUCCESS_CODES.TEAMS_FETCHED,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(res, err.statusCode, err.message, err.errors, err.code);
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  };

  getMyTeams = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId } = req.params;
      const userId = (req as any).userId;
      
      const teams = await this.teamService.getMyTeams(organizationId, userId);

      return successResponse(
        res,
        teams,
        200,
        "Your teams retrieved successfully",
        ORG_SUCCESS_CODES.MY_TEAMS_FETCHED,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(res, err.statusCode, err.message, err.errors, err.code);
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  };
  
  getTeamMembers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId, teamId } = req.params;
      
      const members = await this.teamService.getTeamMembers(organizationId, teamId);

      return successResponse(
        res,
        members,
        200,
        "Team members retrieved successfully",
        ORG_SUCCESS_CODES.TEAM_MEMBERS_FETCHED,
      );
    } catch (err: any) {
      if (err instanceof AppError) {
        return errorResponse(res, err.statusCode, err.message, err.errors, err.code);
      }
      return errorResponse(res, 500, "Internal server error", err);
    }
  };
}
