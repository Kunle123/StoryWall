const User = require('../../domain/models/user');
const { logger } = require('../../utils/logger');

// Get all users (admin only)
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}, { password: 0 });
    
    logger.info('Retrieved all users', { requestId: req.id });
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    logger.error('Error getting users', { 
      error: error.message, 
      requestId: req.id,
      stack: error.stack
    });
    next(error);
  }
};

// Get a specific user by ID
const getUserById = async (req, res, next) => {
  try {
    // Only allow users to access their own profile or admins to access any profile
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      logger.warn('Unauthorized access attempt', { 
        userId: req.user.id, 
        targetId: req.params.id, 
        requestId: req.id 
      });
      return res.status(403).json({ 
        success: false, 
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }
    
    const user = await User.findById(req.params.id, { password: 0 });
    
    if (!user) {
      logger.warn('User not found', { 
        id: req.params.id, 
        requestId: req.id 
      });
      return res.status(404).json({ 
        success: false, 
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }
    
    logger.info('Retrieved user by ID', { 
      id: req.params.id, 
      requestId: req.id 
    });
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    logger.error('Error getting user by ID', { 
      error: error.message, 
      id: req.params.id,
      requestId: req.id,
      stack: error.stack
    });
    next(error);
  }
};

// Create a new user
const createUser = async (req, res, next) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: req.body.email }, { username: req.body.username }]
    });
    
    if (existingUser) {
      logger.warn('User creation failed - duplicate user', { 
        email: req.body.email, 
        username: req.body.username,
        requestId: req.id 
      });
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: 'DUPLICATE_USER', 
          message: 'User with this email or username already exists' 
        }
      });
    }
    
    const newUser = new User(req.body);
    await newUser.save();
    
    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    logger.info('User created successfully', { 
      id: newUser._id, 
      requestId: req.id 
    });
    return res.status(201).json({ success: true, data: userResponse });
  } catch (error) {
    logger.error('Error creating user', { 
      error: error.message,
      requestId: req.id,
      stack: error.stack
    });
    next(error);
  }
};

// Update a user
const updateUser = async (req, res, next) => {
  try {
    // Only allow users to update their own profile or admins to update any profile
    if (req.params.id !== req.user.id && req.user.role !== 'admin') {
      logger.warn('Unauthorized update attempt', { 
        userId: req.user.id, 
        targetId: req.params.id,
        requestId: req.id 
      });
      return res.status(403).json({ 
        success: false, 
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }
    
    // Never update role unless admin
    if (req.body.role && req.user.role !== 'admin') {
      delete req.body.role;
    }
    
    // Don't allow password updates through this endpoint
    if (req.body.password) {
      delete req.body.password;
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, 
      { $set: req.body }, 
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      logger.warn('User update failed - user not found', { 
        id: req.params.id,
        requestId: req.id 
      });
      return res.status(404).json({ 
        success: false, 
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }
    
    logger.info('User updated successfully', { 
      id: req.params.id,
      requestId: req.id 
    });
    return res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    logger.error('Error updating user', { 
      error: error.message,
      id: req.params.id,
      requestId: req.id,
      stack: error.stack
    });
    next(error);
  }
};

// Delete a user
const deleteUser = async (req, res, next) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    
    if (!deletedUser) {
      logger.warn('User deletion failed - user not found', { 
        id: req.params.id,
        requestId: req.id 
      });
      return res.status(404).json({ 
        success: false, 
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }
    
    logger.info('User deleted successfully', { 
      id: req.params.id,
      requestId: req.id 
    });
    return res.status(200).json({ 
      success: true, 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    logger.error('Error deleting user', { 
      error: error.message,
      id: req.params.id,
      requestId: req.id,
      stack: error.stack
    });
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
}; 