
import { Team, TeamMember } from "./team.entity";

export interface ITeamRepository {
  create(team: Omit<Team, "id" | "createdAt" | "updatedAt" | "leader" | "_count">): Promise<Team>;
  update(id: string, team: Partial<Omit<Team, "id" | "createdAt" | "updatedAt" | "leader" | "_count">>): Promise<Team>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Team | null>;
  findByOrganizationId(organizationId: string): Promise<Team[]>;
  addMember(teamId: string, userId: string): Promise<TeamMember>;
  addMembers(teamId: string, userIds: string[]): Promise<TeamMember[]>;
  removeMember(teamId: string, userId: string): Promise<void>;
  findMember(teamId: string, userId: string): Promise<TeamMember | null>;
  getMembers(teamId: string): Promise<TeamMember[]>;
  isLeader(teamId: string, userId: string): Promise<boolean>;
  findTeamsByMember(userId: string, organizationId: string): Promise<Team[]>;
}
