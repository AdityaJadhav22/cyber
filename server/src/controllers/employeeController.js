import User from "../models/User.js";
import { logAudit } from "../utils/audit.js";
import bcrypt from "bcryptjs";

export const addEmployee = async (req, res) => {
  try {
    const { name, email, password, salary, address, department, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Employee email already exists" });

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

    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: "Failed to add employee", error: error.message });
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
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch employees", error: error.message });
  }
};

export const getMyProfile = async (req, res) => {
  const me = await User.findById(req.user._id).select("-password");
  res.json(me);
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await User.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).select("-password");
    if (!updated) return res.status(404).json({ message: "Employee not found" });

    await logAudit({
      actor: req.user._id,
      action: "EMPLOYEE_UPDATED",
      metadata: { employeeId: id, changes: Object.keys(req.body || {}) },
      ip: req.ip,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update employee", error: error.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Employee not found" });

    await logAudit({
      actor: req.user._id,
      action: "EMPLOYEE_DELETED",
      metadata: { employeeId: id },
      ip: req.ip,
      severity: "warning",
    });

    res.json({ message: "Employee deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete employee", error: error.message });
  }
};
