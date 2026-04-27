import User from "../models/User.js";
import { logAudit } from "../utils/audit.js";
import bcrypt from "bcryptjs";
import { fail, ok } from "../utils/response.js";

export const addEmployee = async (req, res) => {
  try {
    const { name, email, password, salary, address, department, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return fail(res, "Employee email already exists", 409);

    const hashedPassword = await bcrypt.hash(password, 12);
    const employee = await User.create({
      name,
      email,
      password: hashedPassword,
      salary: Number(salary),
      address,
      department,
      role: role || "Employee",
    });

    await logAudit({
      actor: req.user._id,
      action: "EMPLOYEE_CREATED",
      metadata: { employeeId: employee._id },
      ip: req.ip,
    });

    const safeEmployee = await User.findById(employee._id).select("-password");
    return ok(res, "Employee created successfully", safeEmployee, 201);
  } catch (error) {
    return fail(res, "Failed to add employee", 500, error.message);
  }
};

export const getEmployees = async (req, res) => {
  try {
    const employees = await User.find().select("-password");
    if (employees.length > Number(process.env.BULK_ACCESS_THRESHOLD || 30)) {
      await logAudit({
        actor: req.user._id,
        action: "SUSPICIOUS_LARGE_DATA_ACCESS",
        metadata: { count: employees.length },
        ip: req.ip,
        severity: "warning",
      });
    }
    return ok(res, "Employees fetched successfully", employees);
  } catch (error) {
    return fail(res, "Failed to fetch employees", 500, error.message);
  }
};

export const getMyProfile = async (req, res) => {
  const me = await User.findById(req.user._id).select("-password");
  return ok(res, "Profile fetched successfully", me);
};

export const updateMyProfile = async (req, res) => {
  try {
    const allowedUpdates = ["name", "address"];
    const payload = Object.fromEntries(
      Object.entries(req.body || {}).filter(([key]) => allowedUpdates.includes(key))
    );
    const updated = await User.findByIdAndUpdate(req.user._id, payload, {
      new: true,
      runValidators: true,
    }).select("-password");
    return ok(res, "Profile updated successfully", updated);
  } catch (error) {
    return fail(res, "Failed to update profile", 500, error.message);
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.body?.status && req.user.role !== "Admin") {
      return fail(res, "Only admin can update employee status", 403);
    }
    const updated = await User.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).select("-password");
    if (!updated) return fail(res, "Employee not found", 404);

    await logAudit({
      actor: req.user._id,
      action: "EMPLOYEE_UPDATED",
      metadata: { employeeId: id, changes: Object.keys(req.body || {}) },
      ip: req.ip,
    });

    return ok(res, "Employee updated successfully", updated);
  } catch (error) {
    return fail(res, "Failed to update employee", 500, error.message);
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return fail(res, "Employee not found", 404);

    await logAudit({
      actor: req.user._id,
      action: "EMPLOYEE_DELETED",
      metadata: { employeeId: id },
      ip: req.ip,
      severity: "warning",
    });

    return ok(res, "Employee deleted successfully");
  } catch (error) {
    return fail(res, "Failed to delete employee", 500, error.message);
  }
};
