/**
 * Domain Layer - Member Repository Port
 */

import {
  OrganizationRole,
  OrganizationMember,
  OrganizationInvitation,
} from "./member.entity";

export interface IMemberRepository {
  addMember(data: {
    organizationId: string;
    userId: string;
    role: OrganizationRole;
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
    role: OrganizationRole;
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
}
