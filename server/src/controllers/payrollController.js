import User from "../models/User.js";
import { logAudit } from "../utils/audit.js";

export const getPayroll = async (req, res) => {
  const records = await User.find().select("name email department role salary");
  res.json(records);
};

export const updateSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const { salary } = req.body;
    const employee = await User.findByIdAndUpdate(
      id,
      { salary: Number(salary) },
      { new: true, runValidators: true }
    ).select("name email salary role");
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    await logAudit({
      actor: req.user._id,
      action: "SALARY_UPDATED",
      metadata: { employeeId: id, salary: employee.salary },
      ip: req.ip,
      severity: "warning",
    });

    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: "Failed to update salary", error: error.message });
  }
};
