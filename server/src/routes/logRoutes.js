import express from "express";
import { getLogs } from "../controllers/logController.js";
import { protect, sessionTimeout } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/rbac.js";

const router = express.Router();

router.get("/", protect, sessionTimeout, authorizeRoles("Admin"), getLogs);

export default router;
