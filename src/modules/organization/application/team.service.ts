/**
 * Application Layer - Team Service
 */

import { ITeamRepository } from "../domain/team.repository";
import { IMemberRepository } from "../domain/member.repository";
import { Team, TeamMember } from "../domain/team.entity";
import { CreateTeamDto, UpdateTeamDto, AddTeamMembersDto } from "./team.dto";
import { OrganizationRole } from "../domain/member.entity";
import { AppError } from "../../../shared/utils/app-error";
import { ERROR_CODES } from "../../../shared/utils/response-code";
import { ORG_ERROR_CODES } from "../interface/organization.response-codes";

export class TeamService {
  constructor(
    private teamRepo: ITeamRepository,
    private memberRepo: IMemberRepository
  ) {}

  private async getMemberRole(organizationId: string, userId: string): Promise<OrganizationRole | null> {
    const member = await this.memberRepo.findMember(organizationId, userId);
    return member ? member.role : null;
  }

  private async ensureTeamExists(teamId: string, organizationId: string): Promise<Team> {
    const team = await this.teamRepo.findById(teamId);
    if (!team || team.organizationId !== organizationId) {
      throw new AppError(
        "Team not found",
        404,
        ORG_ERROR_CODES.TEAM_NOT_FOUND,
      );
    }
    return team;
  }

  async createTeam(
    organizationId: string,
    userId: string,
    data: CreateTeamDto
  ): Promise<Team> {
    const role = await this.getMemberRole(organizationId, userId);
    
    // only owner, admin, team lead can create a team
    if (!role || ![OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.TEAM_LEAD].includes(role)) {
      throw new AppError(
        "Insufficient permissions to create a team",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }

    // the one that created the team is automatically the leader
    const team = await this.teamRepo.create({
      organizationId,
      name: data.name,
      description: data.description || null,
      leaderId: userId,
    });

    // Add initial members if provided
    if (data.memberIds && data.memberIds.length > 0) {
      // Filter out the leader (already added) and validate org membership
      const memberIdsToAdd = data.memberIds.filter((id) => id !== userId);
      if (memberIdsToAdd.length > 0) {
        const validUserIds: string[] = [];
        for (const memberId of memberIdsToAdd) {
          const orgMember = await this.memberRepo.findMember(organizationId, memberId);
          if (orgMember) {
            validUserIds.push(memberId);
          }
        }
        if (validUserIds.length > 0) {
          await this.teamRepo.addMembers(team.id, validUserIds);
        }
      }
    }

    // Re-fetch to get updated member count
    return await this.teamRepo.findById(team.id) as Team;
  }

  async updateTeam(
    organizationId: string,
    userId: string,
    teamId: string,
    data: UpdateTeamDto
  ): Promise<Team> {
    const team = await this.ensureTeamExists(teamId, organizationId);

    // only the leader of the team can update the team details
    if (team.leaderId !== userId) {
      throw new AppError(
        "Only the team leader can update team details",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }

    return await this.teamRepo.update(teamId, data);
  }

  async addMember(
    organizationId: string,
    actorId: string, 
    teamId: string,
    targetUserId: string
  ): Promise<TeamMember> {
    const team = await this.ensureTeamExists(teamId, organizationId);

    const actorRole = await this.getMemberRole(organizationId, actorId);
    const isLeader = team.leaderId === actorId;

    // Owner/Admin can add to any team. Team Lead can only add to their own team.
    const canAdd = 
        actorRole === OrganizationRole.OWNER || 
        actorRole === OrganizationRole.ADMIN || 
        (actorRole === OrganizationRole.TEAM_LEAD && isLeader);

    if (!canAdd) {
      throw new AppError(
        "Insufficient permissions to add members to this team",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }

    // Check if target user is in the organization
    const targetMember = await this.memberRepo.findMember(organizationId, targetUserId);
    if (!targetMember) {
      throw new AppError(
        "User is not a member of the organization",
        400,
        ERROR_CODES.BAD_REQUEST,
      );
    }

    // Check if already in team
    const existingTeamMember = await this.teamRepo.findMember(teamId, targetUserId);
    if (existingTeamMember) {
      throw new AppError(
        "User is already a member of this team",
        409,
        ORG_ERROR_CODES.TEAM_MEMBER_ALREADY_EXISTS,
      );
    }

    return await this.teamRepo.addMember(teamId, targetUserId);
  }

  async addMembers(
    organizationId: string,
    actorId: string,
    teamId: string,
    userIds: string[]
  ): Promise<{ added: TeamMember[]; skipped: string[] }> {
    const team = await this.ensureTeamExists(teamId, organizationId);

    const actorRole = await this.getMemberRole(organizationId, actorId);
    const isLeader = team.leaderId === actorId;

    const canAdd =
      actorRole === OrganizationRole.OWNER ||
      actorRole === OrganizationRole.ADMIN ||
      (actorRole === OrganizationRole.TEAM_LEAD && isLeader);

    if (!canAdd) {
      throw new AppError(
        "Insufficient permissions to add members to this team",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }

    const validUserIds: string[] = [];
    const skipped: string[] = [];

    for (const userId of userIds) {
      // Check org membership
      const orgMember = await this.memberRepo.findMember(organizationId, userId);
      if (!orgMember) {
        skipped.push(userId);
        continue;
      }

      // Check if already in team
      const existingTeamMember = await this.teamRepo.findMember(teamId, userId);
      if (existingTeamMember) {
        skipped.push(userId);
        continue;
      }

      validUserIds.push(userId);
    }

    let added: TeamMember[] = [];
    if (validUserIds.length > 0) {
      added = await this.teamRepo.addMembers(teamId, validUserIds);
    }

    return { added, skipped };
  }

  async removeMember(
    organizationId: string,
    actorId: string,
    teamId: string,
    targetUserId: string
  ): Promise<void> {
    const team = await this.ensureTeamExists(teamId, organizationId);

    const actorRole = await this.getMemberRole(organizationId, actorId);
    const isLeader = team.leaderId === actorId;

    const canRemove = 
        actorRole === OrganizationRole.OWNER || 
        actorRole === OrganizationRole.ADMIN || 
        (actorRole === OrganizationRole.TEAM_LEAD && isLeader);

    if (!canRemove) {
      throw new AppError(
        "Insufficient permissions to remove members from this team",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }
    
    // Prevent removing the leader
    if (targetUserId === team.leaderId) {
      throw new AppError(
        "Cannot remove the team leader",
        400,
        ERROR_CODES.BAD_REQUEST,
      );
    }

    await this.teamRepo.removeMember(teamId, targetUserId);
  }

  async getTeam(organizationId: string, userId: string, teamId: string): Promise<Team> {
    const team = await this.ensureTeamExists(teamId, organizationId);
    
    const isTeamMember = await this.teamRepo.findMember(teamId, userId);
    const isLeader = team.leaderId === userId;
    const role = await this.getMemberRole(organizationId, userId);
    const isOwnerOrAdmin = role === OrganizationRole.OWNER || role === OrganizationRole.ADMIN;

    if (!isTeamMember && !isLeader && !isOwnerOrAdmin) {
      throw new AppError(
        "Access denied. You must be a member of the team or an admin to view details",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }

    return team;
  }

  async getTeamMembers(organizationId: string, teamId: string): Promise<TeamMember[]> {
    await this.ensureTeamExists(teamId, organizationId);
    return await this.teamRepo.getMembers(teamId);
  }

  async getTeams(organizationId: string, userId: string): Promise<Team[]> {
    return await this.teamRepo.findByOrganizationId(organizationId);
  }

  async getMyTeams(organizationId: string, userId: string): Promise<Team[]> {
    return await this.teamRepo.findTeamsByMember(userId, organizationId);
  }
}
