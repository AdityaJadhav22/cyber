import { logEvent } from "../utils/securityLogger.js";
import { fail } from "../utils/response.js";

export const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    logEvent({
      userId: req.user?._id,
      action: "PRIVILEGE_VIOLATION",
      message: "User attempted to access restricted route",
      ip: req.ip,
      severity: "CRITICAL",
      metadata: {
        role: req.user?.role,
        allowedRoles,
        path: req.originalUrl,
        method: req.method,
      },
    });
    return fail(res, "Forbidden: insufficient role", 403);
  }
  next();
};

// Backwards-compatible alias used by existing route imports.
export const authorize = authorizeRoles;
