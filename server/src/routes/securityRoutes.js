import express from "express";
import { fakeSalaryCanary } from "../controllers/securityController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Canary token simulation endpoint intentionally exists to detect suspicious probing.
router.get("/fake-salary", protect, fakeSalaryCanary);

export default router;
