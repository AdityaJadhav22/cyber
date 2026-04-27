import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { fail } from "../utils/response.js";
import { logEvent } from "../utils/securityLogger.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;

    if (!token) {
      await logEvent({
        action: "UNAUTHORIZED_ACCESS",
        message: "Missing JWT token",
        ip: req.ip,
        severity: "HIGH",
        metadata: { path: req.originalUrl, method: req.method },
      });
      return fail(res, "Unauthorized: token missing", 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      await logEvent({
        action: "UNAUTHORIZED_ACCESS",
        message: "JWT valid but user not found",
        ip: req.ip,
        severity: "HIGH",
        metadata: { path: req.originalUrl, method: req.method },
      });
      return fail(res, "Unauthorized: user not found", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    await logEvent({
      action: "UNAUTHORIZED_ACCESS",
      message: "Invalid JWT token",
      ip: req.ip,
      severity: "HIGH",
      metadata: { path: req.originalUrl, method: req.method },
    });
    return fail(res, "Unauthorized: invalid token", 401);
  }
};

export const sessionTimeout = (req, res, next) => {
  const now = Date.now();
  const lastActivity = req.user?.lastActivityAt ? new Date(req.user.lastActivityAt).getTime() : now;
  const maxIdle = Number(process.env.SESSION_TIMEOUT_MS || 900000);

  if (now - lastActivity > maxIdle) {
    return fail(res, "Session expired due to inactivity", 440);
  }

  req.user.lastActivityAt = new Date(now);
  req.user.save().catch(() => {});
  next();
};
