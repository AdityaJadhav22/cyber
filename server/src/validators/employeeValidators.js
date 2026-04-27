import { body, param } from "express-validator";

export const createEmployeeValidation = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 100 }).withMessage("Name too long"),
  body("email").trim().isEmail().withMessage("Valid email required").normalizeEmail(),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  body("department").optional().trim().isLength({ max: 80 }).withMessage("Department too long"),
  body("address").optional().trim().isLength({ max: 255 }).withMessage("Address too long"),
  body("salary").optional().isFloat({ min: 0 }).withMessage("Salary must be a positive number"),
  body("role").optional().isIn(["Admin", "HR Manager", "Employee"]).withMessage("Invalid role"),
];

export const updateEmployeeValidation = [
  param("id").isMongoId().withMessage("Invalid employee id"),
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty").isLength({ max: 100 }).withMessage("Name too long"),
  body("email").optional().trim().isEmail().withMessage("Valid email required").normalizeEmail(),
  body("department").optional().trim().isLength({ max: 80 }).withMessage("Department too long"),
  body("address").optional().trim().isLength({ max: 255 }).withMessage("Address too long"),
  body("salary").optional().isFloat({ min: 0 }).withMessage("Salary must be a positive number"),
  body("role").optional().isIn(["Admin", "HR Manager", "Employee"]).withMessage("Invalid role"),
  body("status").optional().isIn(["Active", "Inactive"]).withMessage("Invalid status"),
];
