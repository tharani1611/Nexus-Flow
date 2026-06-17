const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middlewares/auth');
const upload = require('../config/upload');
const { validateRegister, validateLogin } = require('../middlewares/validation');
const { authLimiter } = require('../middlewares/rateLimiter');

// Public Auth routes
router.post('/register', authLimiter, validateRegister, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);
router.get('/verify', authController.verifyEmail);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

// Protected Auth routes
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);
router.post('/avatar', auth, upload.single('avatar'), authController.uploadAvatar);
router.put('/change-password', auth, authController.changePassword);

module.exports = router;
