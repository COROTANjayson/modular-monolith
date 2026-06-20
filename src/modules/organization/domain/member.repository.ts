/**
 * Domain Layer - Member Repository Port
 */

import {
  OrganizationMember,
  OrganizationInvitation,
} from "./member.entity";

export interface IMemberRepository {
  addMember(data: {
    organizationId: string;
    userId: string;
    roleId: string;
    status: any;
  }): Promise<OrganizationMember>;
  findMember(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMember | null>;
  listMembers(organizationId: string): Promise<OrganizationMember[]>;
  updateMember(
    organizationId: string,
    userId: string,
    data: Partial<OrganizationMember>,
  ): Promise<OrganizationMember>;
  removeMember(organizationId: string, userId: string): Promise<void>;

  // Invitations
  createInvitation(data: {
    organizationId: string;
    inviterId: string;
    email: string;
    roleId: string;
    token: string;
    expiresAt: Date;
  }): Promise<OrganizationInvitation>;
  findInvitationByToken(token: string): Promise<OrganizationInvitation | null>;
  updateInvitation(
    id: string,
    data: Partial<OrganizationInvitation>,
  ): Promise<OrganizationInvitation>;
  listInvitations(organizationId: string): Promise<OrganizationInvitation[]>;
  deleteInvitation(id: string): Promise<void>;

  createDefaultRoles(organizationId: string): Promise<Record<string, string>>;
}
