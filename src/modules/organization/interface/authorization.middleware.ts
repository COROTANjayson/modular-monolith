import { NextFunction, Request, Response } from "express";
import {
  errorResponse,
} from "../../../shared/utils/response.util";
import { ERROR_CODES } from "../../../shared/utils/response-code";
import {
  IOrganizationAuthorization,
  OrganizationPermission,
  TeamAccessAction,
} from "../public/organization-authorization";

function requireIdentifier(
  req: Request,
  res: Response,
  parameterName: string,
): string | null {
  const value = req.params[parameterName];
  if (value) return value;

  errorResponse(
    res,
    400,
    `Missing route parameter: ${parameterName}`,
    undefined,
    ERROR_CODES.BAD_REQUEST,
  );
  return null;
}

function requireUserId(req: Request, res: Response): string | null {
  if (req.userId) return req.userId;
  errorResponse(
    res,
    401,
    "Authentication required",
    undefined,
    ERROR_CODES.UNAUTHORIZED,
  );
  return null;
}

function authorizationFailure(res: Response) {
  return errorResponse(
    res,
    403,
    "Insufficient organization permissions",
    undefined,
    ERROR_CODES.FORBIDDEN,
  );
}

function authorizationError(res: Response) {
  return errorResponse(
    res,
    500,
    "Authorization verification error",
    undefined,
    ERROR_CODES.INTERNAL_SERVER_ERROR,
  );
}

export function requireOrganizationPermission(
  authorization: IOrganizationAuthorization,
  permission: OrganizationPermission,
  organizationParameter: string,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = requireUserId(req, res);
    const organizationId = requireIdentifier(
      req,
      res,
      organizationParameter,
    );
    if (!userId || !organizationId) return;

    try {
      if (!(await authorization.hasPermission(organizationId, userId, permission))) {
        authorizationFailure(res);
        return;
      }
      next();
    } catch {
      authorizationError(res);
    }
  };
}

export function requireOrganizationMembership(
  authorization: IOrganizationAuthorization,
  organizationParameter: string,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = requireUserId(req, res);
    const organizationId = requireIdentifier(
      req,
      res,
      organizationParameter,
    );
    if (!userId || !organizationId) return;

    try {
      if (!(await authorization.getAccess(organizationId, userId))) {
        authorizationFailure(res);
        return;
      }
      next();
    } catch {
      authorizationError(res);
    }
  };
}

export function requireTeamAccess(
  authorization: IOrganizationAuthorization,
  action: TeamAccessAction,
  organizationParameter: string,
  teamParameter: string,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = requireUserId(req, res);
    const organizationId = requireIdentifier(
      req,
      res,
      organizationParameter,
    );
    const teamId = requireIdentifier(req, res, teamParameter);
    if (!userId || !organizationId || !teamId) return;

    try {
      const allowed = await authorization.hasTeamAccess(
        organizationId,
        teamId,
        userId,
        action,
      );
      if (!allowed) {
        authorizationFailure(res);
        return;
      }
      next();
    } catch {
      authorizationError(res);
    }
  };
}
