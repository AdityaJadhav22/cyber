import express from "express";
import rateLimit from "express-rate-limit";
import { forgotPassword, login, resetPassword, signup } from "../controllers/authController.js";
import { handleValidation, sanitizeBody } from "../middleware/validate.js";
import { logEvent } from "../utils/securityLogger.js";
import {
  forgotPasswordValidation,
  loginValidation,
  resetPasswordValidation,
  signupValidation,
} from "../validators/authValidators.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const ip = req.ip || "unknown-ip";
    const email = String(req.body?.email || "unknown-email").trim().toLowerCase();
    return `${ip}:${email}`;
  },
  handler: async (req, res) => {
    await logEvent({
      action: "BRUTE_FORCE_RATE_LIMITED",
      message: "Too many login requests blocked by rate limiter",
      ip: req.ip,
      severity: "CRITICAL",
      metadata: {
        email: String(req.body?.email || "").trim().toLowerCase() || "unknown",
        path: req.originalUrl,
        method: req.method,
      },
    });
    return res.status(429).json({ success: false, message: "Too many login attempts. Please retry later." });
  },
});

router.post("/signup", sanitizeBody, signupValidation, handleValidation, signup);
router.post("/login", loginLimiter, sanitizeBody, loginValidation, handleValidation, login);
router.post("/forgot-password", sanitizeBody, forgotPasswordValidation, handleValidation, forgotPassword);
router.post("/reset-password", sanitizeBody, resetPasswordValidation, handleValidation, resetPassword);

export default router;
