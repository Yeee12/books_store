const fs = require('fs').promises;
const path = require('path');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

/**
 * Upload file to Cloudinary or local storage
 * @param {Object} file - Multer file object
 * @param {Boolean} useCloudinary - Use Cloudinary or local storage
 * @returns {Object} File URL and public ID
 */
const uploadFile = async (file, useCloudinary = true) => {
  if (!file) {
    throw new Error('No file provided');
  }

  // Upload to Cloudinary
  if (useCloudinary && process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      const result = await uploadToCloudinary(file.path, 'bookstore/covers');
      
      // Delete local file after upload
      await fs.unlink(file.path);
      
      return result;
    } catch (error) {
      // If Cloudinary fails, fall back to local storage
      console.error('Cloudinary upload failed, using local storage:', error);
    }
  }

  // Use local storage
  const fileUrl = `/uploads/${file.filename}`;
  return {
    url: fileUrl,
    publicId: null
  };
};

/**
 * Delete file from Cloudinary or local storage
 * @param {String} publicId - Cloudinary public ID
 * @param {String} fileUrl - Local file URL
 */
const deleteFile = async (publicId, fileUrl) => {
  // Delete from Cloudinary
  if (publicId) {
    await deleteFromCloudinary(publicId);
  }
  
  // Delete from local storage
  if (fileUrl && fileUrl.startsWith('/uploads/')) {
    const filePath = path.join(process.cwd(), fileUrl);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting local file:', error);
    }
  }
};

/**
 * Validate uploaded file
 * @param {Object} file - Multer file object
 * @param {Array} allowedTypes - Allowed MIME types
 * @param {Number} maxSize - Maximum file size in bytes
 */
const validateFile = (file, allowedTypes, maxSize) => {
  if (!file) {
    throw new Error('No file uploaded');
  }

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
  }

  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size: ${maxSize / 1024 / 1024}MB`);
  }

  return true;
};

module.exports = {
  uploadFile,
  deleteFile,
  validateFile
};