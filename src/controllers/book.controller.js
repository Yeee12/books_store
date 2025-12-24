const Book = require('../models/Book.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const QueryBuilder = require('../utils/queryBuilder');
const { getPaginationMetadata } = require('../utils/pagination');
const { uploadFile, deleteFile } = require('../services/upload.service');
const { sendNotification } = require('../config/socket');

/**
 * @desc    Get all books with filtering, sorting, pagination
 * @route   GET /api/v1/books
 * @access  Public
 */
const getAllBooks = asyncHandler(async (req, res, next) => {
  // Build query using QueryBuilder
  const features = new QueryBuilder(Book.find(), req.query)
    .filter()
    .search(['title', 'author', 'description'])
    .sort()
    .limitFields()
    .paginate();

  // Execute query
  const books = await features.query;

  // Get total count for pagination
  const totalBooks = await Book.countDocuments();

  // Calculate pagination metadata
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const pagination = getPaginationMetadata(page, limit, totalBooks);

  // Send response
  new ApiResponse(200, {
    books,
    pagination
  }, 'Books retrieved successfully').send(res);
});

/**
 * @desc    Get single book by ID
 * @route   GET /api/v1/books/:id
 * @access  Public
 */
const getBookById = asyncHandler(async (req, res, next) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    return next(new ApiError(404, 'Book not found'));
  }

  new ApiResponse(200, { book }, 'Book retrieved successfully').send(res);
});

/**
 * @desc    Create new book
 * @route   POST /api/v1/books
 * @access  Private (Admin only)
 */
const createBook = asyncHandler(async (req, res, next) => {
  const {
    title,
    author,
    isbn,
    description,
    genre,
    price,
    discountPrice,
    stock,
    publisher,
    publishedDate,
    language,
    pages,
    tags
  } = req.body;

  // 1) Handle cover image upload if provided
  let coverImage = {
    url: 'https://via.placeholder.com/400x600?text=No+Cover',
    publicId: null
  };

  if (req.file) {
    try {
      coverImage = await uploadFile(req.file, true); // Use Cloudinary
    } catch (error) {
      console.error('Error uploading cover image:', error);
      // Continue with default cover if upload fails
    }
  }

  // 2) Create book
  const book = await Book.create({
    title,
    author,
    isbn,
    description,
    genre,
    price,
    discountPrice,
    stock,
    publisher,
    publishedDate,
    language,
    pages,
    tags,
    coverImage,
    addedBy: req.user._id
  });

  // 3) Send real-time notification to admin
  sendNotification(req.user._id.toString(), 'bookCreated', {
    message: `New book "${book.title}" has been added`,
    book: {
      id: book._id,
      title: book.title,
      author: book.author
    },
    timestamp: new Date()
  });

  // 4) Send response
  new ApiResponse(201, { book }, 'Book created successfully').send(res);
});

/**
 * @desc    Update book
 * @route   PATCH /api/v1/books/:id
 * @access  Private (Admin only)
 */
const updateBook = asyncHandler(async (req, res, next) => {
  let book = await Book.findById(req.params.id);

  if (!book) {
    return next(new ApiError(404, 'Book not found'));
  }

  // 1) Handle cover image update if new file uploaded
  if (req.file) {
    try {
      // Delete old cover image if it exists
      if (book.coverImage.publicId || book.coverImage.url.includes('/uploads/')) {
        await deleteFile(book.coverImage.publicId, book.coverImage.url);
      }

      // Upload new cover image
      const newCoverImage = await uploadFile(req.file, true);
      req.body.coverImage = newCoverImage;
    } catch (error) {
      console.error('Error updating cover image:', error);
      // Continue with update even if image upload fails
    }
  }

  // 2) Update book
  book = await Book.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  // 3) Send real-time notification
  sendNotification(req.user._id.toString(), 'bookUpdated', {
    message: `Book "${book.title}" has been updated`,
    book: {
      id: book._id,
      title: book.title
    },
    timestamp: new Date()
  });

  // 4) Send response
  new ApiResponse(200, { book }, 'Book updated successfully').send(res);
});

/**
 * @desc    Delete book
 * @route   DELETE /api/v1/books/:id
 * @access  Private (Admin only)
 */
const deleteBook = asyncHandler(async (req, res, next) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    return next(new ApiError(404, 'Book not found'));
  }

  // 1) Delete cover image if exists
  if (book.coverImage.publicId || book.coverImage.url.includes('/uploads/')) {
    try {
      await deleteFile(book.coverImage.publicId, book.coverImage.url);
    } catch (error) {
      console.error('Error deleting cover image:', error);
    }
  }

  // 2) Delete book
  await book.deleteOne();

  // 3) Send real-time notification
  sendNotification(req.user._id.toString(), 'bookDeleted', {
    message: `Book "${book.title}" has been deleted`,
    timestamp: new Date()
  });

  // 4) Send response
  new ApiResponse(200, null, 'Book deleted successfully').send(res);
});

/**
 * @desc    Get featured books
 * @route   GET /api/v1/books/featured
 * @access  Public
 */
const getFeaturedBooks = asyncHandler(async (req, res, next) => {
  const books = await Book.find({ isFeatured: true, isActive: true })
    .sort('-averageRating -createdAt')
    .limit(10);

  new ApiResponse(200, { books }, 'Featured books retrieved successfully').send(res);
});

/**
 * @desc    Get books by genre
 * @route   GET /api/v1/books/genre/:genre
 * @access  Public
 */
const getBooksByGenre = asyncHandler(async (req, res, next) => {
  const { genre } = req.params;
  
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const skip = (page - 1) * limit;

  // Get books by genre
  const books = await Book.find({ genre, isActive: true })
    .sort('-averageRating -createdAt')
    .skip(skip)
    .limit(limit);

  // Get total count
  const totalBooks = await Book.countDocuments({ genre, isActive: true });

  // Pagination metadata
  const pagination = getPaginationMetadata(page, limit, totalBooks);

  new ApiResponse(200, {
    books,
    pagination,
    genre
  }, `Books in ${genre} retrieved successfully`).send(res);
});

/**
 * @desc    Search books
 * @route   GET /api/v1/books/search
 * @access  Public
 */
const searchBooks = asyncHandler(async (req, res, next) => {
  const { q } = req.query;

  if (!q) {
    return next(new ApiError(400, 'Search query is required'));
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const skip = (page - 1) * limit;

  // Text search
  const books = await Book.find(
    { $text: { $search: q }, isActive: true },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .skip(skip)
    .limit(limit);

  // Get total count
  const totalBooks = await Book.countDocuments(
    { $text: { $search: q }, isActive: true }
  );

  // Pagination metadata
  const pagination = getPaginationMetadata(page, limit, totalBooks);

  new ApiResponse(200, {
    books,
    pagination,
    searchQuery: q
  }, `Search results for "${q}"`).send(res);
});

/**
 * @desc    Get book statistics
 * @route   GET /api/v1/books/stats
 * @access  Private (Admin only)
 */
const getBookStats = asyncHandler(async (req, res, next) => {
  // Aggregate statistics
  const stats = await Book.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: '$genre',
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        avgRating: { $avg: '$averageRating' },
        totalStock: { $sum: '$stock' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // Total books
  const totalBooks = await Book.countDocuments({ isActive: true });

  // Total value of inventory
  const inventoryValue = await Book.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        total: { $sum: { $multiply: ['$price', '$stock'] } }
      }
    }
  ]);

  new ApiResponse(200, {
    totalBooks,
    inventoryValue: inventoryValue[0]?.total || 0,
    genreStats: stats
  }, 'Book statistics retrieved successfully').send(res);
});

/**
 * @desc    Toggle book featured status
 * @route   PATCH /api/v1/books/:id/featured
 * @access  Private (Admin only)
 */
const toggleFeatured = asyncHandler(async (req, res, next) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    return next(new ApiError(404, 'Book not found'));
  }

  book.isFeatured = !book.isFeatured;
  await book.save();

  new ApiResponse(200, { book }, `Book ${book.isFeatured ? 'marked as' : 'removed from'} featured`).send(res);
});

module.exports = {
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
};