import express from "express";
import { adminDashboard, employeeDashboard, suspiciousLogs } from "../controllers/dashboardController.js";
import { protect, sessionTimeout } from "../middleware/auth.js";
import { authorize } from "../middleware/rbac.js";

const router = express.Router();

router.get("/admin", protect, sessionTimeout, authorize("Admin"), adminDashboard);
router.get("/employee", protect, sessionTimeout, authorize("Employee"), employeeDashboard);
router.get("/suspicious", protect, sessionTimeout, authorize("Admin", "Auditor"), suspiciousLogs);

export default router;
