
import { ITeamRepository } from "../domain/team.repository";
import { IMemberRepository } from "../domain/member.repository";
import { Team, TeamMember } from "../domain/team.entity";
import { OrganizationRole } from "../domain/member.entity";

export class TeamService {
  constructor(
    private teamRepo: ITeamRepository,
    private memberRepo: IMemberRepository
  ) {}

  private async getMemberRole(organizationId: string, userId: string): Promise<OrganizationRole | null> {
    const member = await this.memberRepo.findMember(organizationId, userId);
    return member ? member.role : null;
  }

  async createTeam(
    organizationId: string,
    userId: string,
    data: { name: string; description?: string }
  ): Promise<Team> {
    const role = await this.getMemberRole(organizationId, userId);
    
    // only owner, admin, team lead can create a team
    if (!role || ![OrganizationRole.OWNER, OrganizationRole.ADMIN, OrganizationRole.TEAM_LEAD].includes(role)) {
      throw new Error("Insufficient permissions to create a team.");
    }

    // the one that created the team is automtically the leader
    const team = await this.teamRepo.create({
      organizationId,
      name: data.name,
      description: data.description || null,
      leaderId: userId,
    });

    return team;
  }

  async updateTeam(
    organizationId: string,
    userId: string,
    teamId: string,
    data: { name?: string; description?: string }
  ): Promise<Team> {
    const team = await this.teamRepo.findById(teamId);
    if (!team || team.organizationId !== organizationId) {
      throw new Error("Team not found.");
    }

    // only the leader of the team can update the team details
    if (team.leaderId !== userId) {
        throw new Error("Only the team leader can update team details.");
    }

    return await this.teamRepo.update(teamId, data);
  }

  async addMember(
    organizationId: string,
    actorId: string, 
    teamId: string,
    targetUserId: string
  ): Promise<TeamMember> {
    const team = await this.teamRepo.findById(teamId);
    if (!team || team.organizationId !== organizationId) {
      throw new Error("Team not found.");
    }

    const actorRole = await this.getMemberRole(organizationId, actorId);
    const isLeader = team.leaderId === actorId;

    // only owner, admin, team lead can create a team and add member
    // Interpretation: Owner/Admin can add to any team. Team Lead can likely only add to their OWN team?
    // The prompt says: "only owner, admin, team lead can create a team and add member"
    // It doesn't explicitly restrict Team Lead to their own team for adding members, 
    // BUT usually "Team Lead" implies leading THAT team. 
    // However, if I am a Team Lead of Team A, can I add members to Team B? Probably not.
    // So verification: Actor must be (Owner OR Admin) OR (Team Lead AND isLeader of this team).
    
    const canAdd = 
        actorRole === OrganizationRole.OWNER || 
        actorRole === OrganizationRole.ADMIN || 
        (actorRole === OrganizationRole.TEAM_LEAD && isLeader);

    if (!canAdd) {
        throw new Error("Insufficient permissions to add members to this team.");
    }

    // Check if target user is in the organization
    const targetMember = await this.memberRepo.findMember(organizationId, targetUserId);
    if (!targetMember) {
        throw new Error("User is not a member of the organization.");
    }

    // Check if already in team
    const existingTeamMember = await this.teamRepo.findMember(teamId, targetUserId);
    if (existingTeamMember) {
        throw new Error("User is already a member of this team.");
    }

    return await this.teamRepo.addMember(teamId, targetUserId);
  }

  async removeMember(
    organizationId: string,
    actorId: string,
    teamId: string,
    targetUserId: string
  ): Promise<void> {
    const team = await this.teamRepo.findById(teamId);
    if (!team || team.organizationId !== organizationId) {
      throw new Error("Team not found.");
    }

    const actorRole = await this.getMemberRole(organizationId, actorId);
    const isLeader = team.leaderId === actorId;

    // Permissions: Owner, Admin, Leader can remove. 
    // Also user can remove themselves (leave team) - typical feature, but not explicitly asked. 
    // I will stick to restricted removal for now matching add permissions.
    
    const canRemove = 
        actorRole === OrganizationRole.OWNER || 
        actorRole === OrganizationRole.ADMIN || 
        (actorRole === OrganizationRole.TEAM_LEAD && isLeader);

    if (!canRemove) {
        throw new Error("Insufficient permissions to remove members from this team.");
    }
    
    // Prevent removing the leader?
    if (targetUserId === team.leaderId) {
        throw new Error("Cannot remove the team leader.");
    }

    await this.teamRepo.removeMember(teamId, targetUserId);
  }

  async getTeam(organizationId: string, userId: string, teamId: string): Promise<Team> {
      const team = await this.teamRepo.findById(teamId);
      if (!team || team.organizationId !== organizationId) {
          throw new Error("Team not found.");
      }
      
      // "anyone can see team members. but if youre not belong to the team and fetch different team by ids, it prohibits."
      // This sentence is slightly ambiguous: "fetch different team by ids, it prohibits" 
      // likely means "fetch team details" is prohibited if not a member?
      // But it also says "anyone can see team members".
      // So:
      // 1. List Members -> Public to Org
      // 2. Get Team Details -> Restricted to Team Members?
      // Let's implement restriction for Get Team Details.
      
      const isTeamMember = await this.teamRepo.findMember(teamId, userId);
      const isLeader = team.leaderId === userId;
      const role = await this.getMemberRole(organizationId, userId);
      const isOwnerOrAdmin = role === OrganizationRole.OWNER || role === OrganizationRole.ADMIN;

      if (!isTeamMember && !isLeader && !isOwnerOrAdmin) {
          throw new Error("Access denied. You must be a member of the team or an admin to view details.");
      }

      return team;
  }

  async getTeamMembers(organizationId: string, teamId: string): Promise<TeamMember[]> {
      // "anyone can see team members"
      // Verify organization membership of the requestor? 
      // Assuming middleware handles Org membership check for the route, 
      // but here we should ensure team belongs to org.
      const team = await this.teamRepo.findById(teamId);
      if (!team || team.organizationId !== organizationId) {
          throw new Error("Team not found.");
      }
      return await this.teamRepo.getMembers(teamId);
  }

  async getTeams(organizationId: string, userId: string): Promise<Team[]> {
      // Return all teams? Or only teams user belongs to?
      // Usually "List Teams" is available to all.
      // If "fetch different team by ids" prohibits, implies getting specfic details.
      // Listing available teams might be fine.
      // I will allow listing all teams for now.
      return await this.teamRepo.findByOrganizationId(organizationId);
  }

  async getMyTeams(organizationId: string, userId: string): Promise<Team[]> {
      return await this.teamRepo.findTeamsByMember(userId, organizationId);
  }
}
