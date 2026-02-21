const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('../utils/errorHandler');

/**
 * Validate request
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return next(new AppError(errorMessages.join(', '), 400));
  }
  next();
};

/**
 * Registration validation rules
 */
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  validate,
];

/**
 * Login validation rules
 */
const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

/**
 * Product validation rules
 */
const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('purchaseDate').isISO8601().withMessage('Valid purchase date is required'),
  body('warrantyPeriod')
    .isInt({ min: 1 })
    .withMessage('Warranty period must be a positive number'),
  validate,
];

/**
 * MongoDB ObjectId validation
 */
const objectIdValidation = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  validate,
];

module.exports = {
  registerValidation,
  loginValidation,
  productValidation,
  objectIdValidation,
};
