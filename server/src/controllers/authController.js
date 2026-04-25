import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { logAudit } from "../utils/audit.js";

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });

export const signup = async (req, res) => {
  try {
    const { name, email, password, role, department, address, salary } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "Employee",
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

    return res.status(201).json({
      message: "Signup successful",
      token: generateToken(user._id, user.role),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ message: "Signup failed", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, mfaCode } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(423).json({ message: "Account temporarily locked due to failed logins" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
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
      await user.save();
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.mfaEnabled && mfaCode !== "123456") {
      return res.status(401).json({ message: "Invalid MFA code (demo uses 123456)" });
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

    return res.status(200).json({
      message: "Login successful",
      token: generateToken(user._id, user.role),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    const demoShowToken = String(process.env.DEMO_SHOW_RESET_TOKEN || "true").toLowerCase() === "true";

    if (!user) {
      if (demoShowToken) {
        return res.status(404).json({ message: "Email is not registered. Please sign up first." });
      }
      // Return generic response in non-demo mode to avoid account enumeration.
      return res.status(200).json({
        message: "If this email is registered, a reset token has been generated.",
      });
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

    return res.status(200).json({
      message: demoShowToken
        ? "Password reset token generated (demo mode)."
        : "If this email is registered, a reset token has been generated.",
      ...(demoShowToken ? { resetToken: rawToken } : {}),
      expiresInMinutes: 15,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to process forgot password request", error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, mfaCode } = req.body;
    if (mfaCode !== "123456") {
      return res.status(401).json({ message: "Invalid MFA code for password reset" });
    }

    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
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

    return res.status(200).json({ message: "Password reset successful. Please login." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to reset password", error: error.message });
  }
};
