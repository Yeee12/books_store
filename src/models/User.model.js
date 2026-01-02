// ============================================================================
// FILE: src/models/User.model.js
// UPDATED: Fixed pre-save hooks and index configuration
// ============================================================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true, // Re-enabled unique constraint
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  
  avatar: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  passwordChangedAt: Date,
  
  refreshToken: {
    type: String,
    select: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes - removed duplicate email index since unique:true already creates one
userSchema.index({ createdAt: -1 });

// ✅ FIXED: Pre-save hook for password hashing
// With async/await, don't use next() - just return early if needed
userSchema.pre('save', async function() {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return;
  
  // Hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
});

// ✅ FIXED: Pre-save hook for password change timestamp
userSchema.pre('save', function() {
  // Only set passwordChangedAt if password was modified and document is not new
  if (!this.isModified('password') || this.isNew) return;
  
  // Set to 1 second in the past to ensure JWT is created after password change
  this.passwordChangedAt = Date.now() - 1000;
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Custom toJSON method to exclude sensitive fields
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  delete user.__v;
  return user;
};

const User = mongoose.model('User', userSchema);
module.exports = User;