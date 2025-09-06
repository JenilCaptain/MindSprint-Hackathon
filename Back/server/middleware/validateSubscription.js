import { body, validationResult } from "express-validator";

// Validation rules for creating a subscription
export const validateCreateSubscription = [
  body("serviceName")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Service name must be between 1 and 100 characters"),
  
  body("category")
    .isIn(["Entertainment", "Productivity", "Utilities", "Gaming", "Music", "Design", "Storage", "News", "Health", "Other"])
    .withMessage("Invalid category"),
  
  body("cost")
    .isFloat({ min: 0 })
    .withMessage("Cost must be a positive number"),
  
  body("currency")
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage("Currency must be 3 characters"),
  
  body("billingCycle")
    .isIn(["Weekly", "Monthly", "Quarterly", "Yearly"])
    .withMessage("Invalid billing cycle"),
  
  body("nextRenewalDate")
    .isISO8601()
    .withMessage("Next renewal date must be a valid date"),
  
  body("paymentMethod")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Payment method is required"),
  
  body("website")
    .optional()
    .isURL()
    .withMessage("Website must be a valid URL"),
  
  body("notes")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Notes cannot exceed 1000 characters"),
];

// Validation rules for updating a subscription
export const validateUpdateSubscription = [
  body("serviceName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Service name must be between 1 and 100 characters"),
  
  body("category")
    .optional()
    .isIn(["Entertainment", "Productivity", "Utilities", "Gaming", "Music", "Design", "Storage", "News", "Health", "Other"])
    .withMessage("Invalid category"),
  
  body("cost")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Cost must be a positive number"),
  
  body("currency")
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage("Currency must be 3 characters"),
  
  body("billingCycle")
    .optional()
    .isIn(["Weekly", "Monthly", "Quarterly", "Yearly"])
    .withMessage("Invalid billing cycle"),
  
  body("nextRenewalDate")
    .optional()
    .isISO8601()
    .withMessage("Next renewal date must be a valid date"),
  
  body("paymentMethod")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Payment method is required"),
  
  body("website")
    .optional()
    .isURL()
    .withMessage("Website must be a valid URL"),
  
  body("notes")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Notes cannot exceed 1000 characters"),
  
  body("status")
    .optional()
    .isIn(["active", "cancelled", "expired", "paused"])
    .withMessage("Invalid status"),
];

// Middleware to check validation results
export const checkValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// Legacy export for backward compatibility
export const validateSubscription = validateCreateSubscription;
