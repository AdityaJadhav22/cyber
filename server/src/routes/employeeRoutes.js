import express from "express";
import {
  addEmployee,
  deleteEmployee,
  getEmployees,
  getMyProfile,
  updateEmployee,
} from "../controllers/employeeController.js";
import { protect, sessionTimeout } from "../middleware/auth.js";
import { authorize } from "../middleware/rbac.js";
import { validateInput } from "../middleware/validate.js";

const router = express.Router();

router.get("/me", protect, sessionTimeout, getMyProfile);
router.get("/", protect, sessionTimeout, authorize("Admin", "HR Manager", "Auditor"), getEmployees);
router.post(
  "/",
  protect,
  sessionTimeout,
  authorize("Admin", "HR Manager"),
  validateInput(["name", "email", "password"]),
  addEmployee
);
router.put("/:id", protect, sessionTimeout, authorize("Admin", "HR Manager"), updateEmployee);
router.delete("/:id", protect, sessionTimeout, authorize("Admin"), deleteEmployee);

export default router;
