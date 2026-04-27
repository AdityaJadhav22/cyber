import Leave from "../models/Leave.js";
import { logAudit } from "../utils/audit.js";
import { fail, ok } from "../utils/response.js";

export const applyLeave = async (req, res) => {
  try {
    const leave = await Leave.create({
      employee: req.user._id,
      fromDate: req.body.fromDate,
      toDate: req.body.toDate,
      reason: req.body.reason,
    });

    await logAudit({
      actor: req.user._id,
      action: "LEAVE_APPLIED",
      metadata: { leaveId: leave._id },
      ip: req.ip,
    });

    return ok(res, "Leave request submitted", leave, 201);
  } catch (error) {
    return fail(res, "Failed to apply leave", 500, error.message);
  }
};

export const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user._id });
    return ok(res, "Leave records fetched successfully", leaves);
  } catch (error) {
    return fail(res, "Failed to fetch leave records", 500, error.message);
  }
};

export const reviewLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["Approved", "Rejected"].includes(status)) {
      return fail(res, "Invalid leave status", 400);
    }

    const leave = await Leave.findByIdAndUpdate(
      id,
      { status, reviewedBy: req.user._id },
      { new: true }
    );
    if (!leave) return fail(res, "Leave request not found", 404);

    await logAudit({
      actor: req.user._id,
      action: "LEAVE_REVIEWED",
      metadata: { leaveId: id, status },
      ip: req.ip,
    });

    return ok(res, "Leave request reviewed successfully", leave);
  } catch (error) {
    return fail(res, "Failed to review leave", 500, error.message);
  }
};

export const getAllLeaves = async (_req, res) => {
  try {
    const leaves = await Leave.find().populate("employee", "name email department");
    return ok(res, "All leave records fetched successfully", leaves);
  } catch (error) {
    return fail(res, "Failed to fetch leave records", 500, error.message);
  }
};
