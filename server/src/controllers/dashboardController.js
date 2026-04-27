import User from "../models/User.js";
import Leave from "../models/Leave.js";
import AuditLog from "../models/AuditLog.js";
import { fail, ok } from "../utils/response.js";

export const adminDashboard = async (_req, res) => {
  try {
    const [totalEmployees, suspiciousActivities, pendingLeaves] = await Promise.all([
      User.countDocuments(),
      AuditLog.countDocuments({ severity: { $in: ["warning", "critical"] } }),
      Leave.countDocuments({ status: "Pending" }),
    ]);
    return ok(res, "Admin dashboard fetched successfully", { totalEmployees, suspiciousActivities, pendingLeaves });
  } catch (error) {
    return fail(res, "Failed to fetch admin dashboard", 500, error.message);
  }
};

export const employeeDashboard = async (req, res) => {
  try {
    const [profile, leaves] = await Promise.all([
      User.findById(req.user._id).select("-password"),
      Leave.find({ employee: req.user._id }),
    ]);
    return ok(res, "Employee dashboard fetched successfully", { profile, leaves });
  } catch (error) {
    return fail(res, "Failed to fetch employee dashboard", 500, error.message);
  }
};

export const suspiciousLogs = async (_req, res) => {
  try {
    const logs = await AuditLog.find({ severity: { $in: ["warning", "critical"] } })
      .sort({ createdAt: -1 })
      .limit(50);
    return ok(res, "Suspicious activity logs fetched successfully", logs);
  } catch (error) {
    return fail(res, "Failed to fetch suspicious logs", 500, error.message);
  }
};
