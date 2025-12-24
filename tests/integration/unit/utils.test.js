const ApiError = require('../../src/utils/ApiError');
const ApiResponse = require('../../src/utils/ApiResponse');
const { getPaginationMetadata } = require('../../src/utils/pagination');

describe('Utility Functions', () => {
  describe('ApiError', () => {
    it('should create an operational error', () => {
      const error = new ApiError(404, 'Not found');
      
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Not found');
      expect(error.isOperational).toBe(true);
      expect(error.status).toBe('fail');
    });

    it('should set status to error for 5xx codes', () => {
      const error = new ApiError(500, 'Server error');
      
      expect(error.status).toBe('error');
    });
  });

  describe('ApiResponse', () => {
    it('should create a success response', () => {
      const response = new ApiResponse(200, { id: 1 }, 'Success');
      
      expect(response.statusCode).toBe(200);
      expect(response.status).toBe('success');
      expect(response.data).toEqual({ id: 1 });
      expect(response.message).toBe('Success');
    });
  });

  describe('getPaginationMetadata', () => {
    it('should calculate pagination correctly', () => {
      const metadata = getPaginationMetadata(2, 10, 25);
      
      expect(metadata.currentPage).toBe(2);
      expect(metadata.totalPages).toBe(3);
      expect(metadata.totalDocs).toBe(25);
      expect(metadata.hasNextPage).toBe(true);
      expect(metadata.hasPrevPage).toBe(true);
      expect(metadata.nextPage).toBe(3);
      expect(metadata.prevPage).toBe(1);
    });

    it('should handle first page', () => {
      const metadata = getPaginationMetadata(1, 10, 25);
      
      expect(metadata.hasPrevPage).toBe(false);
      expect(metadata.prevPage).toBeNull();
    });

    it('should handle last page', () => {
      const metadata = getPaginationMetadata(3, 10, 25);
      
      expect(metadata.hasNextPage).toBe(false);
      expect(metadata.nextPage).toBeNull();
    });
  });
});