import express from "express";
import { adminDashboard, employeeDashboard, suspiciousLogs } from "../controllers/dashboardController.js";
import { protect, sessionTimeout } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/rbac.js";

const router = express.Router();

router.get("/admin", protect, sessionTimeout, authorizeRoles("Admin"), adminDashboard);
router.get("/employee", protect, sessionTimeout, authorizeRoles("Employee"), employeeDashboard);
router.get("/suspicious", protect, sessionTimeout, authorizeRoles("Admin"), suspiciousLogs);

export default router;
