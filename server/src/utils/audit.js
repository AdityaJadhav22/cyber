import AuditLog from "../models/AuditLog.js";

export const logAudit = async ({ actor, action, metadata = {}, ip = "", severity = "info" }) => {
  try {
    await AuditLog.create({ actor, action, metadata, ip, severity });
  } catch (error) {
    console.error("Failed to write audit log:", error.message);
  }
};
