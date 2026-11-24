const express = require('express');
const { registerUser, loginUser, logoutUser } = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', registerUser);

// POST /api/auth/login
router.post('/login', loginUser);

// POST /api/auth/logout (protected — requires valid token)
router.post('/logout', auth, logoutUser);

module.exports = router;