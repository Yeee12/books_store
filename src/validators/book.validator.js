const { body, param, query } = require('express-validator');

/**
 * Validation rules for creating a book
 */
const createBookValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Book title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  
  body('author')
    .trim()
    .notEmpty().withMessage('Author name is required')
    .isLength({ max: 100 }).withMessage('Author name cannot exceed 100 characters'),
  
  body('isbn')
    .optional()
    .trim()
    .matches(/^(?:\d{10}|\d{13})$/).withMessage('ISBN must be 10 or 13 digits'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  
  body('genre')
    .notEmpty().withMessage('Genre is required')
    .isIn([
      'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery',
      'Thriller', 'Romance', 'Horror', 'Biography', 'History', 'Science',
      'Self-Help', 'Business', 'Technology', 'Other'
    ]).withMessage('Invalid genre'),
  
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  
  body('discountPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Discount price must be a positive number')
    .custom((value, { req }) => {
      if (value && parseFloat(value) >= parseFloat(req.body.price)) {
        throw new Error('Discount price must be less than regular price');
      }
      return true;
    }),
  
  body('stock')
    .notEmpty().withMessage('Stock quantity is required')
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  
  body('publisher')
    .optional()
    .trim(),
  
  body('publishedDate')
    .optional()
    .isISO8601().withMessage('Please provide a valid date'),
  
  body('language')
    .optional()
    .trim(),
  
  body('pages')
    .optional()
    .isInt({ min: 1 }).withMessage('Pages must be at least 1'),
  
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array')
];

/**
 * Validation rules for updating a book
 */
const updateBookValidation = [
  param('id')
    .isMongoId().withMessage('Invalid book ID'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
  
  body('author')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Author name must be between 1 and 100 characters'),
  
  body('isbn')
    .optional()
    .trim()
    .matches(/^(?:\d{10}|\d{13})$/).withMessage('ISBN must be 10 or 13 digits'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  
  body('genre')
    .optional()
    .isIn([
      'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery',
      'Thriller', 'Romance', 'Horror', 'Biography', 'History', 'Science',
      'Self-Help', 'Business', 'Technology', 'Other'
    ]).withMessage('Invalid genre'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  
  body('discountPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Discount price must be a positive number'),
  
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  
  body('pages')
    .optional()
    .isInt({ min: 1 }).withMessage('Pages must be at least 1')
];

/**
 * Validation for MongoDB ID parameter
 */
const validateId = [
  param('id')
    .isMongoId().withMessage('Invalid ID format')
];

/**
 * Validation for query parameters
 */
const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  query('sort')
    .optional()
    .isString().withMessage('Sort must be a string'),
  
  query('search')
    .optional()
    .trim()
    .isString().withMessage('Search must be a string')
];

module.exports = {
  createBookValidation,
  updateBookValidation,
  validateId,
  queryValidation
};