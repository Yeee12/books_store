// FILE: src/utils/queryBuilder.js
// LOCATION: Create this file at: src/utils/queryBuilder.js
// PURPOSE: Build complex MongoDB queries from URL query parameters
// ============================================================================

/**
 * WHAT IS THIS?
 * A class that converts URL query parameters into MongoDB queries.
 * Handles filtering, searching, sorting, field selection, and pagination.
 * 
 * WHY DO WE NEED IT?
 * URLs can have complex queries like:
 * /api/books?price[gte]=20&price[lte]=50&genre=Technology&sort=-price&page=2&limit=10
 * 
 * This class converts those parameters into proper MongoDB queries.
 * 
 * FEATURES:
 * 1. Filtering: price >= 20, price <= 50
 * 2. Searching: Search in title, author, description
 * 3. Sorting: Sort by price (ascending or descending)
 * 4. Field selection: Return only specific fields
 * 5. Pagination: Page 2, limit 10
 * 
 * HOW TO USE:
 * const features = new QueryBuilder(Book.find(), req.query)
 *   .filter()
 *   .search(['title', 'author'])
 *   .sort()
 *   .limitFields()
 *   .paginate();
 * 
 * const books = await features.query;
 */

class QueryBuilder {
  /**
   * Initialize QueryBuilder
   * 
   * @param {Object} query - Mongoose query (e.g., Book.find())
   * @param {Object} queryString - req.query from Express
   * 
   * EXAMPLE:
   * const queryBuilder = new QueryBuilder(Book.find(), req.query);
   */
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  /**
   * FEATURE 1: Filter results based on query parameters
   * 
   * Supports:
   * - Exact match: ?genre=Technology
   * - Greater than or equal: ?price[gte]=20
   * - Greater than: ?price[gt]=20
   * - Less than or equal: ?price[lte]=50
   * - Less than: ?price[lt]=50
   * 
   * EXAMPLE URL:
   * /api/books?price[gte]=20&price[lte]=50&genre=Technology
   * 
   * This filters books where:
   * - Price >= 20
   * - Price <= 50
   * - Genre = Technology
   */
  filter() {
    // Create a copy of query object
    const queryObj = { ...this.queryString };

    // Remove fields that are not filters
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach(field => delete queryObj[field]);

    // Convert operators to MongoDB format
    // ?price[gte]=20 becomes { price: { $gte: 20 } }
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    // Apply filter to query
    this.query = this.query.find(JSON.parse(queryStr));

    return this; // Return this for method chaining
  }

  /**
   * FEATURE 2: Search functionality
   * Searches across multiple fields using case-insensitive regex
   * 
   * @param {Array} searchFields - Fields to search in
   * 
   * EXAMPLE URL:
   * /api/books?search=javascript
   * 
   * This searches for "javascript" in title, author, and description
   * Case-insensitive: "JavaScript", "JAVASCRIPT", "javascript" all match
   */
  search(searchFields = ['title', 'author', 'description']) {
    if (this.queryString.search) {
      // Create an $or query that searches in all specified fields
      const searchQuery = {
        $or: searchFields.map(field => ({
          [field]: { 
            $regex: this.queryString.search, // Search term
            $options: 'i' // Case-insensitive
          }
        }))
      };
      
      this.query = this.query.find(searchQuery);
    }

    return this;
  }

  /**
   * FEATURE 3: Sort results
   * 
   * EXAMPLES:
   * ?sort=price          -> Sort by price ascending (low to high)
   * ?sort=-price         -> Sort by price descending (high to low)
   * ?sort=price,-rating  -> Sort by price asc, then rating desc
   * 
   * If no sort specified, defaults to newest first (-createdAt)
   */
  sort() {
    if (this.queryString.sort) {
      // Convert comma-separated values to space-separated
      // "price,-rating" becomes "price -rating"
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      // Default: Sort by creation date, newest first
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  /**
   * FEATURE 4: Limit fields in response
   * Return only specific fields instead of all fields
   * 
   * EXAMPLES:
   * ?fields=title,author,price  -> Return only these fields
   * 
   * WHY?
   * - Reduces response size
   * - Faster queries
   * - Don't send unnecessary data
   * 
   * By default, excludes __v field (MongoDB version key)
   */
  limitFields() {
    if (this.queryString.fields) {
      // Convert comma-separated to space-separated
      // "title,author,price" becomes "title author price"
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // Exclude __v field by default (internal MongoDB field)
      this.query = this.query.select('-__v');
    }

    return this;
  }

  /**
   * FEATURE 5: Apply pagination
   * 
   * EXAMPLES:
   * ?page=2&limit=20  -> Get page 2 with 20 items per page
   * ?page=1&limit=10  -> Get page 1 with 10 items per page
   * 
   * Default: page=1, limit=10
   * Maximum limit: 100 (prevents abuse)
   */
  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 10;
    
    // Calculate how many documents to skip
    const skip = (page - 1) * limit;

    // Limit maximum to 100 items per page
    this.query = this.query.skip(skip).limit(Math.min(limit, 100));

    return this;
  }
}

module.exports = QueryBuilder;