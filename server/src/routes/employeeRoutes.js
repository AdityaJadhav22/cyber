import express from "express";
import {
  addEmployee,
  deleteEmployee,
  getEmployees,
  getMyProfile,
  updateMyProfile,
  updateEmployee,
} from "../controllers/employeeController.js";
import { protect, sessionTimeout } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/rbac.js";
import { handleValidation, sanitizeBody } from "../middleware/validate.js";
import { createEmployeeValidation, updateEmployeeValidation } from "../validators/employeeValidators.js";

const router = express.Router();

router.get("/me", protect, sessionTimeout, getMyProfile);
router.put("/me", protect, sessionTimeout, sanitizeBody, updateMyProfile);
router.get("/", protect, sessionTimeout, authorizeRoles("Admin", "HR Manager"), getEmployees);
router.post(
  "/",
  protect,
  sessionTimeout,
  authorizeRoles("Admin", "HR Manager"),
  sanitizeBody,
  createEmployeeValidation,
  handleValidation,
  addEmployee
);
router.put("/:id", protect, sessionTimeout, authorizeRoles("Admin", "HR Manager"), sanitizeBody, updateEmployeeValidation, handleValidation, updateEmployee);
router.delete("/:id", protect, sessionTimeout, authorizeRoles("Admin"), deleteEmployee);

export default router;
