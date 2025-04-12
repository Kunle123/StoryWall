const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../../domain/models/user');
const { logger } = require('../../utils/logger');

// User login
const login = async (req, res, next) => {
  try {
    // Validate request
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' }
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn('Login failed - user not found', { 
        email,
        requestId: req.id 
      });
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' }
      });
    }

    // Check if account is verified
    if (!user.isVerified) {
      logger.warn('Login failed - account not verified', { 
        userId: user._id,
        requestId: req.id 
      });
      return res.status(401).json({
        success: false,
        error: { code: 'ACCOUNT_NOT_VERIFIED', message: 'Please verify your email address before logging in' }
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn('Login failed - invalid password', { 
        userId: user._id,
        requestId: req.id 
      });
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' }
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret-for-development-only',
      { expiresIn: '1d' }
    );

    logger.info('User logged in successfully', { 
      userId: user._id, 
      requestId: req.id 
    });
    
    // Send response with user data (excluding password) and token
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.verificationToken;
    delete userResponse.resetPasswordToken;
    delete userResponse.resetPasswordExpires;

    return res.status(200).json({
      success: true,
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    logger.error('Error during login', { 
      error: error.message,
      requestId: req.id,
      stack: error.stack
    });
    next(error);
  }
};

// User registration
const register = async (req, res, next) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Username, email, and password are required' }
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      logger.warn('Registration failed - duplicate user', { 
        email, 
        username, 
        requestId: req.id 
      });
      return res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE_USER', message: 'User with this email or username already exists' }
      });
    }
    
    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Create new user
    const newUser = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      verificationToken
    });
    
    await newUser.save();
    
    // In a real application, send verification email here
    // For this example, we'll just log it
    logger.info('Verification email would be sent', {
      userId: newUser._id,
      email,
      verificationToken,
      requestId: req.id
    });
    
    logger.info('User registered successfully', { 
      userId: newUser._id, 
      requestId: req.id 
    });
    
    // Response without sensitive data
    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.'
    });
  } catch (error) {
    logger.error('Error during registration', { 
      error: error.message,
      requestId: req.id,
      stack: error.stack
    });
    next(error);
  }
};

// Email verification
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Verification token is required' }
      });
    }
    
    const user = await User.findOne({ verificationToken: token });
    
    if (!user) {
      logger.warn('Email verification failed - invalid token', { 
        token, 
        requestId: req.id 
      });
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid verification token' }
      });
    }
    
    // Verify the user
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    
    logger.info('Email verified successfully', { 
      userId: user._id, 
      requestId: req.id 
    });
    
    return res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now log in.'
    });
  } catch (error) {
    logger.error('Error during email verification', { 
      error: error.message,
      requestId: req.id,
      stack: error.stack
    });
    next(error);
  }
};

// Forgot password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email is required' }
      });
    }
    
    const user = await User.findOne({ email });
    
    // Don't reveal if user exists or not for security
    if (!user) {
      logger.info('Forgot password requested for non-existent user', { 
        email, 
        requestId: req.id 
      });
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link'
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Set token and expiry
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    
    // In a real application, send reset email here
    // For this example, we'll just log it
    logger.info('Password reset email would be sent', {
      userId: user._id,
      email,
      resetToken,
      requestId: req.id
    });
    
    return res.status(200).json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link'
    });
  } catch (error) {
    logger.error('Error during forgot password', { 
      error: error.message,
      requestId: req.id,
      stack: error.stack
    });
    next(error);
  }
};

// Reset password
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Token and new password are required' }
      });
    }
    
    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      logger.warn('Password reset failed - invalid or expired token', { 
        token, 
        requestId: req.id 
      });
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Password reset token is invalid or has expired' }
      });
    }
    
    // Update password and clear reset token
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    logger.info('Password reset successful', { 
      userId: user._id, 
      requestId: req.id 
    });
    
    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    logger.error('Error during password reset', { 
      error: error.message,
      requestId: req.id,
      stack: error.stack
    });
    next(error);
  }
};

module.exports = {
  login,
  register,
  verifyEmail,
  forgotPassword,
  resetPassword
}; 