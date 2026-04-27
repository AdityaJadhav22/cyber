import { logEvent } from "./securityLogger.js";

// Backward-compatible wrapper used by existing controllers.
export const logAudit = async ({ actor, action, message = "", metadata = {}, ip = "", severity = "info" }) =>
  logEvent({
    userId: actor,
    action,
    message,
    metadata,
    ip,
    severity,
  });
