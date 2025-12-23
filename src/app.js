const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const routes = require('./routes');
const errorMiddleware = require('./middlewares/error.middleware');
const ApiError = require('./utils/ApiError');

// Initialize Express app
const app = express();

// ============================================
// SECURITY MIDDLEWARES
// ============================================

// Set security HTTP headers
app.use(helmet());

// Enable CORS for cross-origin requests
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// ============================================
// BODY PARSING MIDDLEWARES
// ============================================

// Parse JSON bodies (limit: 10mb)
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// PERFORMANCE MIDDLEWARES
// ============================================

// Compress all responses
app.use(compression());

// HTTP request logger (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ============================================
// STATIC FILES
// ============================================

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// ============================================
// HEALTH CHECK ROUTE
// ============================================

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running smoothly!',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// API ROUTES
// ============================================

// Mount all routes under /api/v1
app.use('/api/v1', routes);

// ============================================
// 404 HANDLER - Route not found
// ============================================

app.all('*', (req, res, next) => {
  next(new ApiError(404, `Cannot find ${req.originalUrl} on this server!`));
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

app.use(errorMiddleware);

module.exports = app;

