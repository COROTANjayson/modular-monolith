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

export function createOrganizationModule(): { router: Router } {
  // Infrastructure
  const organizationRepo = new PrismaOrganizationRepository();
  const userRepo = new PrismaUserRepository();

  // Application
  const organizationService = new OrganizationService(organizationRepo);
  const memberService = new MemberService(organizationRepo, userRepo);

  // Interface
  const organizationController = new OrganizationController(
    organizationService,
  );
  const memberController = new MemberController(memberService);

  // Router
  const router = createOrganizationRouter(
    organizationController,
    memberController,
  );

  return { router };
}
