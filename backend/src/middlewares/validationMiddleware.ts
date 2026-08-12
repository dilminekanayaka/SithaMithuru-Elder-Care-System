import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/responseWrapper";

// Middleware to check for validation errors and return them
export const validateResult = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(
      res,
      "Validation Error",
      400,
      errors.array().map((err: any) => ({ field: err.path, message: err.msg }))
    );
  }
  next();
};

// Validation rules for Register
export const registerValidationRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("Must be a valid email address"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("role")
    .isIn(["Elder", "Guardian"])
    .withMessage("Role must be either 'Elder' or 'Guardian'"),
  validateResult,
];

// Validation rules for Login
export const loginValidationRules = [
  body("email").trim().isEmail().withMessage("Must be a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
  validateResult,
];

// Validation rules for Forgot Password
export const forgotPasswordValidationRules = [
  body("email").trim().isEmail().withMessage("Must be a valid email address"),
  validateResult,
];

// Validation rules for Reset Password
export const resetPasswordValidationRules = [
  body("email").trim().isEmail().withMessage("Must be a valid email address"),
  body("code").trim().isLength({ min: 6, max: 6 }).withMessage("Verification code must be 6 digits"),
  body("new_password")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long"),
  validateResult,
];

// Validation rules for adding/updating medications
export const medicationValidationRules = [
  body("name").trim().notEmpty().withMessage("Medication name is required"),
  body("time_schedule")
    .trim()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage("Time schedule must be in HH:MM format (24-hour style)"),
  validateResult,
];

// Validation rules for tasks
export const taskValidationRules = [
  body("title").trim().notEmpty().withMessage("Task title is required"),
  body("due_time")
    .optional()
    .trim()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage("Due time must be in HH:MM format (24-hour style)"),
  validateResult,
];

// Validation rules for mood entries
export const moodValidationRules = [
  body("mood_type")
    .isIn(["Happy", "Sad", "Neutral", "Anxious", "Angry"])
    .withMessage("Mood type must be one of: Happy, Sad, Neutral, Anxious, Angry"),
  validateResult,
];

// Validation rules for user profile updates
export const profileValidationRules = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("age")
    .optional({ nullable: true })
    .isInt({ min: 0, max: 130 })
    .withMessage("Age must be an integer between 0 and 130"),
  body("weight")
    .optional({ nullable: true })
    .isFloat({ min: 1, max: 500 })
    .withMessage("Weight must be a number between 1 and 500 kg"),
  body("blood_type")
    .optional({ nullable: true })
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .withMessage("Invalid blood type"),
  validateResult,
];

// Validation rules for connection setup
export const connectionValidationRules = [
  body("token")
    .trim()
    .matches(/^SM-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
    .withMessage("Invitation code must be in SM-XXXX-YYYY format"),
  body("relationship")
    .optional()
    .isIn(["Son", "Daughter", "Spouse", "Grandchild", "Sibling", "Caregiver", "Friend", "Doctor", "Other"])
    .withMessage("Invalid relationship type"),
  body("permissionLevel")
    .optional()
    .isIn(["Primary", "Secondary"])
    .withMessage("Permission level must be Primary or Secondary"),
  validateResult,
];

// Validation rules for medication logging
export const medicationLogValidationRules = [
  body("medication_id").isInt().withMessage("medication_id must be an integer"),
  body("elder_id").isInt().withMessage("elder_id must be an integer"),
  body("taken_status").isBoolean().withMessage("taken_status must be a boolean"),
  body("client_updated_at")
    .optional()
    .isISO8601()
    .withMessage("client_updated_at must be a valid ISO8601 date string"),
  validateResult,
];
