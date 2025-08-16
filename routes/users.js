const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

router.get('/histories', authenticateJWT, userController.getHistory);
router.get('/dashboard', authenticateJWT,userController.getDashboardDetail)
router.get('/download/videos/:id',authenticateJWT,userController.downloadVideo)
module.exports = router;
