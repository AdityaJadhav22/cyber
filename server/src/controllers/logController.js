import AuditLog from "../models/AuditLog.js";
import { fail, ok } from "../utils/response.js";

const normalizeSeverityFilter = (severity) => {
  if (!severity) return null;
  const value = String(severity).trim().toUpperCase();
  if (value === "LOW") return { $in: ["LOW", "info"] };
  if (value === "HIGH") return { $in: ["HIGH", "warning"] };
  if (value === "CRITICAL") return { $in: ["CRITICAL", "critical"] };
  return null;
};

export const getLogs = async (req, res) => {
  try {
    const { severity, action } = req.query;
    const filter = {};
    const normalizedSeverity = normalizeSeverityFilter(severity);
    if (normalizedSeverity) {
      filter.severity = normalizedSeverity;
    }
    if (action) {
      filter.action = String(action).trim();
    }

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("actor", "name email role");

    return ok(res, "Logs fetched successfully", logs);
  } catch (error) {
    return fail(res, "Failed to fetch logs", 500, error.message);
  }
};
