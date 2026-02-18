
import { Request, Response, NextFunction } from "express";
import { TeamService } from "../application/team.service";

export class TeamController {
  constructor(private teamService: TeamService) {}

  createTeam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId } = req.params;
      const userId = (req as any).userId; // Assumed from auth middleware
      const { name, description } = req.body;

      const team = await this.teamService.createTeam(organizationId, userId, {
        name,
        description,
      });

      res.status(201).json(team);
    } catch (error) {
      next(error);
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

      res.status(200).json(team);
    } catch (error) {
      next(error);
    }
  };

  addMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId, teamId } = req.params;
      const actorId = (req as any).userId;
      const { userId } = req.body; // Target user to add

      const member = await this.teamService.addMember(
        organizationId,
        actorId,
        teamId,
        userId
      );

      res.status(201).json(member);
    } catch (error) {
      next(error);
    }
  };

  removeMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId, teamId, userId } = req.params; // Target user in params
      const actorId = (req as any).userId;

      await this.teamService.removeMember(organizationId, actorId, teamId, userId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  getTeam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId, teamId } = req.params;
      const userId = (req as any).userId;

      const team = await this.teamService.getTeam(organizationId, userId, teamId);

      res.status(200).json(team);
    } catch (error) {
      next(error);
    }
  };

  getTeams = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { organizationId } = req.params;
      const userId = (req as any).userId;

      const teams = await this.teamService.getTeams(organizationId, userId);

      res.status(200).json(teams);
    } catch (error) {
      next(error);
    }
  };
  
  getTeamMembers = async (req: Request, res: Response, next: NextFunction) => {
      try {
          const { organizationId, teamId } = req.params;
          // Verify permissions? Service handles logic, but mostly public to org.
          
          const members = await this.teamService.getTeamMembers(organizationId, teamId);
          res.status(200).json(members);
      } catch (error) {
          next(error);
      }
  }
}
