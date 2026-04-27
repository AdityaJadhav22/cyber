import AuditLog from "../models/AuditLog.js";

const severityMap = {
  info: "LOW",
  warning: "HIGH",
  critical: "CRITICAL",
  low: "LOW",
  high: "HIGH",
};

const normalizeSeverity = (severity = "LOW") => {
  const key = String(severity).trim();
  return severityMap[key] || severityMap[key.toLowerCase()] || "LOW";
};

// Central security logging utility used by middleware/controllers.
export const logEvent = async ({ userId, action, message = "", ip = "", severity = "LOW", metadata = {} }) => {
  try {
    const resolvedIp = ip || metadata.ip || "unknown";
    await AuditLog.create({
      actor: userId || null,
      action,
      message,
      metadata,
      ip: resolvedIp,
      severity: normalizeSeverity(severity),
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to write security log:", error.message);
  }
};
