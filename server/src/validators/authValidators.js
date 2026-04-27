import { body } from "express-validator";

export const signupValidation = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 100 }).withMessage("Name too long"),
  body("email").trim().isEmail().withMessage("Valid email required").normalizeEmail(),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  body("role")
    .optional()
    .custom((value) => {
      const normalized = String(value).trim().toLowerCase();
      return ["admin", "hr manager", "hr_manager", "hr", "employee"].includes(normalized);
    })
    .withMessage("Invalid role"),
];

export const loginValidation = [
  body("email").trim().isEmail().withMessage("Valid email required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  body("mfaCode").optional().matches(/^\d{6}$/).withMessage("MFA code must be 6 digits"),
];

export const forgotPasswordValidation = [body("email").trim().isEmail().withMessage("Valid email required").normalizeEmail()];

export const resetPasswordValidation = [
  body("resetToken").trim().notEmpty().withMessage("Reset token is required"),
  body("newPassword").isLength({ min: 8 }).withMessage("New password must be at least 8 characters"),
  body("mfaCode").matches(/^\d{6}$/).withMessage("MFA code must be 6 digits"),
];
