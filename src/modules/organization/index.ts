/**
 * Organization Module - Public API
 */

import { Router } from "express";
import { PrismaOrganizationRepository } from "./infrastructure/prisma-organization.repository";
import { OrganizationService } from "./application/organization.service";
import { OrganizationController } from "./interface/organization.controller";
import { createOrganizationRouter } from "./interface/organization.routes";

export function createOrganizationModule(): { router: Router } {
  // Infrastructure
  const organizationRepo = new PrismaOrganizationRepository();

  // Application
  const organizationService = new OrganizationService(organizationRepo);

  // Interface
  const organizationController = new OrganizationController(
    organizationService,
  );

  // Router
  const router = createOrganizationRouter(organizationController);

  return { router };
}
