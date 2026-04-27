import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { logAudit } from "../utils/audit.js";
import { fail, ok } from "../utils/response.js";
import { logEvent } from "../utils/securityLogger.js";

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });

const normalizeRole = (value = "") => {
  const raw = String(value).trim().toLowerCase();
  if (raw === "admin") return "Admin";
  if (raw === "hr manager" || raw === "hr_manager" || raw === "hr") return "HR Manager";
  return "Employee";
};

const loginAttemptByIp = new Map();
const bruteForceWindowMs = 5 * 60 * 1000;
const bruteForceThreshold = 5;

const registerFailedAttempt = async (ip, email, userId) => {
  const now = Date.now();
  const attempts = (loginAttemptByIp.get(ip) || []).filter((time) => now - time < bruteForceWindowMs);
  attempts.push(now);
  loginAttemptByIp.set(ip, attempts);

  if (attempts.length > bruteForceThreshold) {
    await logEvent({
      userId,
      action: "BRUTE_FORCE_ATTACK",
      message: "Multiple failed login attempts detected from same IP",
      ip,
      severity: "CRITICAL",
      metadata: { attempts: attempts.length, email, windowMs: bruteForceWindowMs },
    });
  }
};

export const signup = async (req, res) => {
  try {
    const { name, email, password, role, department, address, salary } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return fail(res, "Email already exists", 409);

    const selectedRole = normalizeRole(role || department);
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: selectedRole,
      department,
      address,
      salary: Number(salary || 0),
    });

    await logAudit({
      actor: user._id,
      action: "USER_SIGNUP",
      metadata: { email: user.email, role: user.role },
      ip: req.ip,
    });

    return ok(
      res,
      "Signup successful",
      {
        token: generateToken(user._id, user.role),
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      },
      201
    );
  } catch (error) {
    return fail(res, "Signup failed", 500, error.message);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, mfaCode } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      await registerFailedAttempt(req.ip, email, null);
      await logEvent({
        action: "FAILED_LOGIN_ATTEMPT",
        message: "Login failed for unknown account",
        ip: req.ip,
        severity: "HIGH",
        metadata: { email },
      });
      return fail(res, "Invalid credentials", 401);
    }

    if (user.status === "Inactive") {
      await logEvent({
        userId: user._id,
        action: "LOGIN_BLOCKED_INACTIVE_USER",
        message: "Inactive account attempted to login",
        ip: req.ip,
        severity: "HIGH",
        metadata: { email },
      });
      return fail(res, "Account is inactive. Contact admin.", 403);
    }

    // Logs every login attempt for accountability and security monitoring.
    await logAudit({
      actor: user._id,
      action: "USER_LOGIN_ATTEMPT",
      metadata: { email, role: user.role },
      ip: req.ip,
    });

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return fail(res, "Account temporarily locked due to failed logins", 423);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await registerFailedAttempt(req.ip, email, user._id);
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 10 * 60 * 1000);
        await logAudit({
          actor: user._id,
          action: "SUSPICIOUS_MULTIPLE_FAILED_LOGINS",
          metadata: { attempts: user.failedLoginAttempts, email },
          ip: req.ip,
          severity: "critical",
        });
      }
      await logAudit({
        actor: user._id,
        action: "USER_LOGIN_FAILED",
        message: "Invalid password provided",
        metadata: { attempts: user.failedLoginAttempts, email },
        ip: req.ip,
        severity: "warning",
      });
      await logEvent({
        userId: user._id,
        action: "FAILED_LOGIN_ATTEMPT",
        message: "Failed login attempt detected",
        ip: req.ip,
        severity: "HIGH",
        metadata: { email, attempts: user.failedLoginAttempts },
      });
      await user.save();
      return fail(res, "Invalid credentials", 401);
    }

    if (user.mfaEnabled && mfaCode !== "123456") {
      return fail(res, "Invalid MFA code (demo uses 123456)", 401);
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.lastActivityAt = new Date();
    await user.save();

    await logAudit({
      actor: user._id,
      action: "USER_LOGIN",
      metadata: { role: user.role },
      ip: req.ip,
    });

    return ok(res, "Login successful", {
      token: generateToken(user._id, user.role),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return fail(res, "Login failed", 500, error.message);
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    const demoShowToken = String(process.env.DEMO_SHOW_RESET_TOKEN || "true").toLowerCase() === "true";

    if (!user) {
      if (demoShowToken) {
        return fail(res, "Email is not registered. Please sign up first.", 404);
      }
      // Return generic response in non-demo mode to avoid account enumeration.
      return ok(res, "If this email is registered, a reset token has been generated.");
    }

    const rawToken = crypto.randomBytes(24).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await logAudit({
      actor: user._id,
      action: "PASSWORD_RESET_REQUESTED",
      metadata: { email: user.email },
      ip: req.ip,
      severity: "warning",
    });

    return ok(res, demoShowToken ? "Password reset token generated (demo mode)." : "If this email is registered, a reset token has been generated.", {
      ...(demoShowToken ? { resetToken: rawToken } : {}),
      expiresInMinutes: 15,
    });
  } catch (error) {
    return fail(res, "Failed to process forgot password request", 500, error.message);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, mfaCode } = req.body;
    if (mfaCode !== "123456") {
      return fail(res, "Invalid MFA code for password reset", 401);
    }

    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return fail(res, "Invalid or expired reset token", 400);
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await user.save();

    await logAudit({
      actor: user._id,
      action: "PASSWORD_RESET_COMPLETED",
      metadata: { email: user.email },
      ip: req.ip,
      severity: "warning",
    });

    return ok(res, "Password reset successful. Please login.");
  } catch (error) {
    return fail(res, "Failed to reset password", 500, error.message);
  }
};
