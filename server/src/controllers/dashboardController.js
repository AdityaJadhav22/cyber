import User from "../models/User.js";
import Leave from "../models/Leave.js";
import AuditLog from "../models/AuditLog.js";

export const adminDashboard = async (_req, res) => {
  const [totalEmployees, suspiciousActivities, pendingLeaves] = await Promise.all([
    User.countDocuments(),
    AuditLog.countDocuments({ severity: { $in: ["warning", "critical"] } }),
    Leave.countDocuments({ status: "Pending" }),
  ]);

  res.json({ totalEmployees, suspiciousActivities, pendingLeaves });
};

export const employeeDashboard = async (req, res) => {
  const [profile, leaves] = await Promise.all([
    User.findById(req.user._id).select("-password"),
    Leave.find({ employee: req.user._id }),
  ]);

  res.json({ profile, leaves });
};

export const suspiciousLogs = async (_req, res) => {
  const logs = await AuditLog.find({ severity: { $in: ["warning", "critical"] } })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(logs);
};
