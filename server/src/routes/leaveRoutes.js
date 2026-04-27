import express from "express";
import { body, param } from "express-validator";
import { applyLeave, getAllLeaves, getMyLeaves, reviewLeave } from "../controllers/leaveController.js";
import { protect, sessionTimeout } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/rbac.js";
import { handleValidation, sanitizeBody } from "../middleware/validate.js";

const router = express.Router();

router.post(
  "/",
  protect,
  sessionTimeout,
  authorizeRoles("Employee"),
  sanitizeBody,
  [
    body("fromDate").isISO8601().withMessage("fromDate must be a valid date"),
    body("toDate").isISO8601().withMessage("toDate must be a valid date"),
    body("reason").trim().notEmpty().withMessage("Reason is required").isLength({ max: 500 }).withMessage("Reason too long"),
  ],
  handleValidation,
  applyLeave
);
router.get("/mine", protect, sessionTimeout, authorizeRoles("Employee"), getMyLeaves);
router.get("/", protect, sessionTimeout, authorizeRoles("Admin", "HR Manager"), getAllLeaves);
router.put(
  "/:id/review",
  protect,
  sessionTimeout,
  authorizeRoles("HR Manager", "Admin"),
  sanitizeBody,
  [
    param("id").isMongoId().withMessage("Invalid leave id"),
    body("status").isIn(["Approved", "Rejected"]).withMessage("Status must be Approved or Rejected"),
  ],
  handleValidation,
  reviewLeave
);

export default router;
