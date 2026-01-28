/**
 * Domain Layer - Repository Ports
 */

import {
  Organization,
  OrganizationMember,
  OrganizationInvitation,
  OrganizationRole,
} from "./organization.entity";

export interface IOrganizationRepository {
  create(data: {
    name: string;
    slug: string;
    ownerId: string;
  }): Promise<Organization>;
  findById(id: string): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
  update(id: string, data: Partial<Organization>): Promise<Organization>;

  // Members
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
}
