import { fail } from "../utils/response.js";
import { logEvent } from "../utils/securityLogger.js";

const sqlInjectionPattern = /('|")\s*or\s*1=1|--|drop\s+table|select\s+\*|union(\s+all)?\s+select/i;
const xssPattern = /<script\b|javascript:|onerror\s*=/i;

const hasSuspiciousPattern = (value, pattern) => {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.some((item) => hasSuspiciousPattern(item, pattern));
  if (typeof value === "object") return Object.values(value).some((item) => hasSuspiciousPattern(item, pattern));
  if (typeof value === "string") return pattern.test(value);
  return false;
};

const detectThreat = (req, pattern) =>
  hasSuspiciousPattern(req.body, pattern) ||
  hasSuspiciousPattern(req.query, pattern) ||
  hasSuspiciousPattern(req.params, pattern);

export const detectInjectionAttempts = async (req, res, next) => {
  const ip = req.ip;
  const userId = req.user?._id;

  if (detectThreat(req, sqlInjectionPattern)) {
    await logEvent({
      userId,
      action: "SQL_INJECTION_ATTEMPT",
      message: "Suspicious query detected",
      ip,
      severity: "CRITICAL",
      metadata: { path: req.originalUrl, method: req.method },
    });
    return fail(res, "Blocked request: suspicious SQL injection pattern detected", 403);
  }

  if (detectThreat(req, xssPattern)) {
    await logEvent({
      userId,
      action: "XSS_ATTEMPT",
      message: "Potential XSS payload detected",
      ip,
      severity: "HIGH",
      metadata: { path: req.originalUrl, method: req.method },
    });
    return fail(res, "Blocked request: suspicious XSS pattern detected", 403);
  }

  return next();
};
