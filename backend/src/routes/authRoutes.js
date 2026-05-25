const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const OAuthCode = require('../models/OAuthCode');

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

const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─── OAuth Code Deduplication (MongoDB-based, cross-instance) ─────────────────
// Render free plan runs multiple overlapping server instances during redeploy.
// Each instance has its own memory — an in-memory Map does NOT work across them.
// MongoDB's unique index gives us an atomic cross-instance lock:
// only the FIRST instance to insert a given code proceeds; all others get E11000.
const deduplicateOAuth = async (req, res, next) => {
  const code = req.query.code;
  if (!code) return next();
  try {
    await OAuthCode.create({ code }); // throws E11000 if another instance already claimed it
    next();
  } catch (err) {
    if (err.code === 11000) {
      console.warn('[OAUTH] Duplicate code blocked by MongoDB lock — another instance already handled it.');
      return res.redirect(`${FRONTEND}/login?error=oauth_retry`);
    }
    next(err); // unexpected error, let Express handle it
  }
};

const makeJwt = (userId) =>
  jwt.sign({ id: userId, role: 'customer' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

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
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get(
  '/google/callback',
  deduplicateOAuth,
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err || !user) {
        console.error('[GOOGLE] OAuth error:', err?.message || info?.message);
        return res.redirect(`${FRONTEND}/login?error=google_auth_failed`);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  (req, res) => {
    res.redirect(`${FRONTEND}/auth/callback?token=${makeJwt(req.user._id)}`);
  }
);

// ─── Facebook OAuth ────────────────────────────────────────────────────────────
router.get('/facebook', passport.authenticate('facebook', { scope: ['public_profile', 'email'], session: false }));

router.get(
  '/facebook/callback',
  deduplicateOAuth,
  (req, res, next) => {
    passport.authenticate('facebook', { session: false }, (err, user, info) => {
      if (err || !user) {
        console.error('[FACEBOOK] OAuth error:', err?.message || info?.message);
        return res.redirect(`${FRONTEND}/login?error=facebook_auth_failed`);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  (req, res) => {
    res.redirect(`${FRONTEND}/auth/callback?token=${makeJwt(req.user._id)}`);
  }
);

module.exports = router;
