// ============================================================================
// FILE: src/utils/pagination.js
// LOCATION: Create this file at: src/utils/pagination.js
// PURPOSE: Helper functions for pagination in list endpoints
// ============================================================================

/**
 * WHAT IS PAGINATION?
 * Instead of returning all 10,000 books at once, we return 10 books per page.
 * User can request page 1, page 2, etc.
 * 
 * WHY DO WE NEED IT?
 * - Performance: Loading 10,000 records is slow
 * - User experience: Easier to browse paginated data
 * - Bandwidth: Reduces data transfer
 * 
 * EXAMPLE:
 * Page 1: Books 1-10
 * Page 2: Books 11-20
 * Page 3: Books 21-30
 * 
 * Each response includes:
 * - Current page number
 * - Total pages
 * - Total items
 * - Has next/previous page
 */

/**
 * FUNCTION 1: Calculate pagination metadata
 * Given page number, limit, and total docs, calculate all pagination info
 * 
 * @param {Number} page - Current page number (1, 2, 3...)
 * @param {Number} limit - Items per page (10, 20, 50...)
 * @param {Number} totalDocs - Total number of documents in database
 * @returns {Object} - Pagination metadata
 * 
 * EXAMPLE:
 * getPaginationMetadata(2, 10, 45)
 * Returns:
 * {
 *   currentPage: 2,
 *   totalPages: 5,      // 45 items / 10 per page = 5 pages
 *   totalDocs: 45,
 *   limit: 10,
 *   hasNextPage: true,  // Page 3 exists
 *   hasPrevPage: true,  // Page 1 exists
 *   nextPage: 3,
 *   prevPage: 1
 * }
 */
const getPaginationMetadata = (page, limit, totalDocs) => {
  // Calculate total number of pages
  const totalPages = Math.ceil(totalDocs / limit);
  
  // Check if next/previous pages exist
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    currentPage: page,
    totalPages,
    totalDocs,
    limit,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };
};

/**
 * FUNCTION 2: Apply pagination to Mongoose query
 * Modifies the query to skip and limit results
 * 
 * @param {Object} query - Mongoose query object
 * @param {Number} page - Page number (default: 1)
 * @param {Number} limit - Items per page (default: 10)
 * @returns {Object} - Modified query with pagination
 * 
 * EXAMPLE:
 * let query = Book.find({ genre: 'Technology' });
 * query = applyPagination(query, 2, 10);
 * const books = await query;
 * 
 * This will return books 11-20 (skipping first 10)
 * 
 * HOW IT WORKS:
 * Page 1: skip(0).limit(10)  -> Get items 1-10
 * Page 2: skip(10).limit(10) -> Get items 11-20
 * Page 3: skip(20).limit(10) -> Get items 21-30
 */
const applyPagination = (query, page = 1, limit = 10) => {
  // Ensure page and limit are positive integers
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 10;

  // Limit maximum items per page to 100 (prevent abuse)
  limit = Math.min(limit, 100);

  // Calculate how many items to skip
  // Page 1: skip 0 items
  // Page 2: skip 10 items (if limit is 10)
  // Page 3: skip 20 items
  const skip = (page - 1) * limit;

  // Apply skip and limit to query
  return query.skip(skip).limit(limit);
};

module.exports = {
  getPaginationMetadata,
  applyPagination
};

