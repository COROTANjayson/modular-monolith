/**
 * Organization Module - Public API
 */

import { Router } from "express";
import { PrismaOrganizationRepository } from "./infrastructure/prisma-organization.repository";
import { PrismaUserRepository } from "../user/infrastructure/prisma-user.repository";
import { OrganizationService } from "./application/organization.service";
import { MemberService } from "./application/member.service";
import { OrganizationController } from "./interface/organization.controller";
import { MemberController } from "./interface/member.controller";
import { createOrganizationRouter } from "./interface/organization.routes";

import { PrismaMemberRepository } from "./infrastructure/prisma-member.repository";
import { PrismaTeamRepository } from "./infrastructure/prisma-team.repository";
import { TeamService } from "./application/team.service";
import { TeamController } from "./interface/team.controller";
import { createMemberRouter } from "./interface/member.routes";
import { createTeamRouter } from "./interface/team.routes";
import { OrganizationAuthorizationService } from "./application/organization-authorization.service";
import { IOrganizationAuthorization } from "./public/organization-authorization";

export function createOrganizationModule(): {
  router: Router;
  authorization: IOrganizationAuthorization;
} {
  // Infrastructure
  const organizationRepo = new PrismaOrganizationRepository();
  const memberRepo = new PrismaMemberRepository();
  const teamRepo = new PrismaTeamRepository();
  const userRepo = new PrismaUserRepository();
  const authorization = new OrganizationAuthorizationService(
    memberRepo,
    teamRepo,
  );

  // Application
  const organizationService = new OrganizationService(
    organizationRepo,
    memberRepo,
  );
  const memberService = new MemberService(
    organizationRepo,
    memberRepo,
    userRepo,
  );
  const teamService = new TeamService(teamRepo, memberRepo);

  // Interface
  const organizationController = new OrganizationController(
    organizationService,
  );
  const memberController = new MemberController(memberService);
  const teamController = new TeamController(teamService);

  // Router
  const router = Router();
  router.use(
    "/",
    createOrganizationRouter(organizationController, authorization),
  );
  router.use("/", createMemberRouter(memberController, authorization));
  router.use("/", createTeamRouter(teamController, authorization));

  return { router, authorization };
}

export type {
  IOrganizationAuthorization,
  OrganizationAccess,
  TeamAccessAction,
} from "./public/organization-authorization";
export { OrganizationPermission } from "./public/organization-authorization";
