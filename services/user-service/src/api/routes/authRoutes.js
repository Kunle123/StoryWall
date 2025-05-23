const express = require('express');
const { 
  login, 
  register, 
  verifyEmail, 
  forgotPassword, 
  resetPassword 
} = require('../controllers/authController');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router; 