const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const authenticateJWT = require('../middleware/authMiddleware');

// Step 1: Send verification code to phone
router.post('/signup/phone', authController.sendVerificationCodes);

// Step 2: Verify code
router.post('/signup/verify', authController.verifyCode);

// Step 3: Final signup (details)
router.post('/signup/details', authController.completeSignup);

// Login routes
router.post('/login/phone', authController.login);

router.get('/captcha',authController.captcha)

router.get('/check-auth', authenticateJWT, (req, res) => {
  res.json({ id: req.user.id, name: req.user.name });
});

router.post('/forgot-pass/phone',authController.sendfpVerificationCode);
router.post('/forgot-pass/verify',authController.verifyfpCode)
router.post('/forgot-pass/resetPassword',authController.resetPassword)

// Logout route
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});


module.exports = router;
