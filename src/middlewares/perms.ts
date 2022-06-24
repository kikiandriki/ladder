/**
 * Member of server middleware.
 */

// External imports.
import { NextFunction, Request, Response } from "express"

// Utility imports.
import { ForbiddenError } from "@utils/exceptions"

/**
 * Simple function to check if a permission exists
 * in a list of permissions.
 */
function checkPermission(permissions: string[], required: string) {
  if (!permissions.includes(required)) {
    throw new ForbiddenError("You do not have permission.")
  }
  return
}

/**
 * Express member handler.
 */
export const perms = (required: string[] | string) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const permissions = req.actor.permissions
    if (typeof required === "string") {
      checkPermission(permissions, required)
    } else {
      for (const permission of required) {
        checkPermission(permissions, permission)
      }
    }
    return next()
  }
}
