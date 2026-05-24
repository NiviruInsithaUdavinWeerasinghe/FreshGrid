const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');

const {
  registerUser,
  verifyEmail,
  loginUser,
  getMe,
  adminLogin,
  registerPasskeyBegin,
  registerPasskeyFinish,
  loginPasskeyBegin,
  loginPasskeyFinish,
  updateProfile,
  changePassword,
  verifyPassword,
  unlinkPasskey,
  subscribeToPromotions,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// ─── Standard Auth ─────────────────────────────────────────────────────────────
router.post('/register', registerUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', loginUser);
router.post('/admin/login', adminLogin);
router.get('/me', protect, getMe);
router.put('/profile', protect, upload.single('image'), updateProfile);
router.put('/profile/password', protect, changePassword);
router.post('/profile/verify-password', protect, verifyPassword);
router.post('/subscribe', protect, subscribeToPromotions);

// ─── Passkeys (WebAuthn) ───────────────────────────────────────────────────────
router.post('/passkey/register/begin', protect, registerPasskeyBegin);
router.post('/passkey/register/finish', protect, registerPasskeyFinish);
router.post('/passkey/login/begin', loginPasskeyBegin);
router.post('/passkey/login/finish', loginPasskeyFinish);
router.post('/passkey/unlink', protect, unlinkPasskey);

// ─── Google OAuth ──────────────────────────────────────────────────────────────
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`,
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${token}`);
  }
);

// ─── Facebook OAuth ────────────────────────────────────────────────────────────
router.get(
  '/facebook',
  passport.authenticate('facebook', {
    scope: ['public_profile', 'email'],
    session: false,
  })
);

router.get(
  '/facebook/callback',
  passport.authenticate('facebook', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`,
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${token}`);
  }
);

module.exports = router;
