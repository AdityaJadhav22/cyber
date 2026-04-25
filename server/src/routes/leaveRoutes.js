import express from "express";
import { applyLeave, getAllLeaves, getMyLeaves, reviewLeave } from "../controllers/leaveController.js";
import { protect, sessionTimeout } from "../middleware/auth.js";
import { authorize } from "../middleware/rbac.js";
import { validateInput } from "../middleware/validate.js";

const router = express.Router();

router.post("/", protect, sessionTimeout, authorize("Employee"), validateInput(["fromDate", "toDate", "reason"]), applyLeave);
router.get("/mine", protect, sessionTimeout, authorize("Employee"), getMyLeaves);
router.get("/", protect, sessionTimeout, authorize("Admin", "HR Manager", "Auditor"), getAllLeaves);
router.put("/:id/review", protect, sessionTimeout, authorize("HR Manager", "Admin"), validateInput(["status"]), reviewLeave);

export default router;
