import express from "express";
import { body, param } from "express-validator";
import { getPayroll, updateSalary } from "../controllers/payrollController.js";
import { protect, sessionTimeout } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/rbac.js";
import { handleValidation, sanitizeBody } from "../middleware/validate.js";

const router = express.Router();

router.get("/", protect, sessionTimeout, authorizeRoles("Admin", "HR Manager"), getPayroll);
router.put(
  "/:id",
  protect,
  sessionTimeout,
  authorizeRoles("Admin", "HR Manager"),
  sanitizeBody,
  [param("id").isMongoId().withMessage("Invalid employee id"), body("salary").isFloat({ min: 0 }).withMessage("Salary must be a positive number")],
  handleValidation,
  updateSalary
);

export default router;
