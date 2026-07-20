import { NextFunction, Request, Response } from "express";
import {
  requireOrganizationPermission,
  requireTeamAccess,
} from "../../../src/modules/organization/interface/authorization.middleware";
import {
  IOrganizationAuthorization,
  OrganizationPermission,
} from "../../../src/modules/organization/public/organization-authorization";

describe("organization authorization middleware", () => {
  const authorization = {
    getAccess: jest.fn(),
    hasPermission: jest.fn(),
    hasTeamAccess: jest.fn(),
  } as jest.Mocked<IOrganizationAuthorization>;
  const next = jest.fn() as NextFunction;
  let status: jest.Mock;
  let json: jest.Mock;
  let response: Response;

  beforeEach(() => {
    jest.clearAllMocks();
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    response = { status } as unknown as Response;
  });

  it("returns 400 when the configured organization parameter is absent", async () => {
    const middleware = requireOrganizationPermission(
      authorization,
      OrganizationPermission.ORG_READ,
      "organizationId",
    );
    await middleware(
      { params: {}, userId: "user-1" } as unknown as Request,
      response,
      next,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when authentication context is absent", async () => {
    const middleware = requireOrganizationPermission(
      authorization,
      OrganizationPermission.ORG_READ,
      "organizationId",
    );
    await middleware(
      { params: { organizationId: "org-1" } } as unknown as Request,
      response,
      next,
    );

    expect(status).toHaveBeenCalledWith(401);
  });

  it("returns 403 when permission is denied", async () => {
    authorization.hasPermission.mockResolvedValue(false);
    const middleware = requireOrganizationPermission(
      authorization,
      OrganizationPermission.ORG_READ,
      "organizationId",
    );
    await middleware(
      {
        params: { organizationId: "org-1" },
        userId: "user-1",
      } as unknown as Request,
      response,
      next,
    );

    expect(status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when team access is allowed", async () => {
    authorization.hasTeamAccess.mockResolvedValue(true);
    const middleware = requireTeamAccess(
      authorization,
      "chat",
      "orgId",
      "teamId",
    );
    await middleware(
      {
        params: { orgId: "org-1", teamId: "team-1" },
        userId: "user-1",
      } as unknown as Request,
      response,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("returns a generic 500 when authorization fails unexpectedly", async () => {
    authorization.hasPermission.mockRejectedValue(new Error("database details"));
    const middleware = requireOrganizationPermission(
      authorization,
      OrganizationPermission.ORG_READ,
      "organizationId",
    );
    await middleware(
      {
        params: { organizationId: "org-1" },
        userId: "user-1",
      } as unknown as Request,
      response,
      next,
    );

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.not.objectContaining({ errors: expect.anything() }),
    );
  });
});
