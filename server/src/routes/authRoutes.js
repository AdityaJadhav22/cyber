import express from "express";
import rateLimit from "express-rate-limit";
import { forgotPassword, login, resetPassword, signup } from "../controllers/authController.js";
import { validateInput } from "../middleware/validate.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many login attempts. Please retry later.",
});

router.post("/signup", validateInput(["name", "email", "password"]), signup);
router.post("/login", loginLimiter, validateInput(["email", "password", "mfaCode"]), login);
router.post("/forgot-password", validateInput(["email"]), forgotPassword);
router.post("/reset-password", validateInput(["resetToken", "newPassword", "mfaCode"]), resetPassword);

export default router;
