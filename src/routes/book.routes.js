const express = require('express');
const router = express.Router();

const {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getFeaturedBooks,
  getBooksByGenre,
  searchBooks,
  getBookStats,
  toggleFeatured
} = require('../controllers/book.controller');

const { protect, restrictTo } = require('../middlewares/auth.middleware');
const { uploadSingle } = require('../middlewares/upload.middleware');
const { uploadLimiter } = require('../middlewares/rateLimiter.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  createBookValidation,
  updateBookValidation,
  validateId,
  queryValidation
} = require('../validators/book.validator');

// Public routes
router.get('/', queryValidation, validate, getAllBooks);
router.get('/featured', getFeaturedBooks);
router.get('/search', searchBooks);
router.get('/genre/:genre', getBooksByGenre);
router.get('/:id', validateId, validate, getBookById);

// Protected routes - Admin only
router.use(protect, restrictTo('admin'));

router.post(
  '/',
  uploadLimiter,
  uploadSingle('coverImage'),
  createBookValidation,
  validate,
  createBook
);

router.patch(
  '/:id',
  uploadLimiter,
  uploadSingle('coverImage'),
  updateBookValidation,
  validate,
  updateBook
);

router.delete('/:id', validateId, validate, deleteBook);
router.patch('/:id/featured', validateId, validate, toggleFeatured);
router.get('/admin/stats', getBookStats);

module.exports = router;