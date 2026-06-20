export interface Role {
  id: string;
  organizationId: string;
  name: string;
  permissions: string[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const DefaultRoleNames = {
  OWNER: "owner",
  ADMIN: "admin",
  TEAM_LEAD: "team_lead",
  MEMBER: "member",
} as const;

export enum OrganizationMemberStatus {
  INVITED = "invited",
  ACTIVE = "active",
  SUSPENDED = "suspended",
  LEFT = "left",
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  roleId: string;
  role?: Role;
  status: OrganizationMemberStatus;
  invitedAt: Date;
  joinedAt: Date | null;
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  inviterId: string;
  email: string;
  roleId: string;
  role?: Role;
  token: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
}
