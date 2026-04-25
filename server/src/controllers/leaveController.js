import Leave from "../models/Leave.js";
import { logAudit } from "../utils/audit.js";

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

    res.status(201).json(leave);
  } catch (error) {
    res.status(500).json({ message: "Failed to apply leave", error: error.message });
  }
};

export const getMyLeaves = async (req, res) => {
  const leaves = await Leave.find({ employee: req.user._id });
  res.json(leaves);
};

export const reviewLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid leave status" });
    }

    const leave = await Leave.findByIdAndUpdate(
      id,
      { status, reviewedBy: req.user._id },
      { new: true }
    );
    if (!leave) return res.status(404).json({ message: "Leave request not found" });

    await logAudit({
      actor: req.user._id,
      action: "LEAVE_REVIEWED",
      metadata: { leaveId: id, status },
      ip: req.ip,
    });

    res.json(leave);
  } catch (error) {
    res.status(500).json({ message: "Failed to review leave", error: error.message });
  }
};

export const getAllLeaves = async (_req, res) => {
  const leaves = await Leave.find().populate("employee", "name email department");
  res.json(leaves);
};
