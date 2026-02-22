/**
 * Application Layer - Team DTOs
 */

export interface CreateTeamDto {
  name: string;
  description?: string;
  memberIds?: string[];
}

export interface UpdateTeamDto {
  name?: string;
  description?: string;
}

export interface AddTeamMembersDto {
  userIds: string[];
}
