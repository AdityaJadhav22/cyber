import { validationResult } from "express-validator";
import { fail } from "../utils/response.js";

const noSqlPattern = /\$where|\$ne|\$gt|\$lt|\$regex|\$or|\$and/i;

const sanitizeRecursively = (input) => {
  if (Array.isArray(input)) return input.map(sanitizeRecursively);
  if (input && typeof input === "object") {
    const safeObject = {};
    for (const [key, value] of Object.entries(input)) {
      if (key.startsWith("$")) {
        throw new Error("Potential NoSQL injection key detected");
      }
      safeObject[key] = sanitizeRecursively(value);
    }
    return safeObject;
  }
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (noSqlPattern.test(trimmed)) {
      throw new Error("Potential NoSQL injection pattern detected");
    }
    return trimmed;
  }
  return input;
};

// Sanitizes incoming body payload to reduce injection risk before controllers run.
export const sanitizeBody = (req, res, next) => {
  try {
    req.body = sanitizeRecursively(req.body || {});
    next();
  } catch (error) {
    return fail(res, error.message, 400);
  }
};

export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(
      res,
      "Validation failed",
      400,
      errors.array().map((err) => ({ field: err.path, message: err.msg }))
    );
  }
  next();
};
