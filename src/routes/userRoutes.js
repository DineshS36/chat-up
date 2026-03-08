const express = require('express');
const { getUsers } = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

// GET /api/users
router.get('/', getUsers);

module.exports = router;
