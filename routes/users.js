const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

router.get('/histories', authenticateJWT, userController.getHistory);

module.exports = router;
