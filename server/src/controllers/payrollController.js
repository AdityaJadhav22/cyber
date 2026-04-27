import User from "../models/User.js";
import { logAudit } from "../utils/audit.js";
import { fail, ok } from "../utils/response.js";

export const getPayroll = async (req, res) => {
  try {
    const records = await User.find().select("name email department role salary");
    return ok(res, "Payroll records fetched successfully", records);
  } catch (error) {
    return fail(res, "Failed to fetch payroll records", 500, error.message);
  }
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
    if (!employee) return fail(res, "Employee not found", 404);

    await logAudit({
      actor: req.user._id,
      action: "SALARY_UPDATED",
      metadata: { employeeId: id, salary: employee.salary },
      ip: req.ip,
      severity: "warning",
    });

    return ok(res, "Salary updated successfully", employee);
  } catch (error) {
    return fail(res, "Failed to update salary", 500, error.message);
  }
};
