/**
 * Domain Layer - Organization Entities
 */

export enum OrganizationRole {
  OWNER = "owner",
  ADMIN = "admin",
  EDITOR = "editor",
  VIEWER = "viewer",
}

export enum OrganizationMemberStatus {
  INVITED = "invited",
  ACTIVE = "active",
  SUSPENDED = "suspended",
  LEFT = "left",
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  status: OrganizationMemberStatus;
  invitedAt: Date;
  joinedAt: Date | null;
}

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: OrganizationRole;
  token: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
}
