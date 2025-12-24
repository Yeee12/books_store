const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const bookRoutes = require('./book.routes');
const userRoutes = require('./user.routes');

const { apiLimiter } = require('../middlewares/rateLimiter.middleware');

// Apply rate limiting to all routes
router.use(apiLimiter);

// Mount routes
router.use('/auth', authRoutes);
router.use('/books', bookRoutes);
router.use('/users', userRoutes);

// API info route
router.get('/', (req, res) => {
  res.json({
    message: 'Bookstore API v1',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      books: '/api/v1/books',
      users: '/api/v1/users'
    },
    documentation: 'https://documenter.getpostman.com/view/your-collection-id',
    status: 'active'
  });
});

module.exports = router;