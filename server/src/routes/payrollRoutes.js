import express from "express";
import { getPayroll, updateSalary } from "../controllers/payrollController.js";
import { protect, sessionTimeout } from "../middleware/auth.js";
import { authorize } from "../middleware/rbac.js";
import { validateInput } from "../middleware/validate.js";

const router = express.Router();

router.get("/", protect, sessionTimeout, authorize("Admin", "HR Manager", "Auditor"), getPayroll);
router.put(
  "/:id",
  protect,
  sessionTimeout,
  authorize("Admin", "HR Manager"),
  validateInput(["salary"]),
  updateSalary
);

export default router;
