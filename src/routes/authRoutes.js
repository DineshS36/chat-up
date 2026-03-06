const express = require('express');
const { register, login, getMe, updateProfile } = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);

module.exports = router;