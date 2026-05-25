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

// ─── OAuth Code Deduplication (Two-layer: in-memory + MongoDB) ──────────────────
//
// Facebook always fires the callback URL TWICE in rapid succession.
// Both requests race to the backend simultaneously, and whichever one hits
// Facebook's token exchange API SECOND gets "This authorization code has been used".
//
// Layer 1 — In-memory Set (handles same-process duplicates, microsecond-fast)
//   The Set is checked synchronously before any async work, so the second
//   request from the same server process is rejected immediately — before it
//   can race to call Facebook's /oauth/access_token endpoint.
//
// Layer 2 — MongoDB unique index (handles cross-instance duplicates on Render)
//   Only reached when two different server instances (e.g. during a blue-green
//   deploy) each receive one of the two Facebook callback requests.
//
const _inFlightOAuthCodes = new Set();

const deduplicateOAuth = async (req, res, next) => {
  const code = req.query.code;
  if (!code) return next();

  // Layer 1: same-process lock (synchronous — zero latency)
  if (_inFlightOAuthCodes.has(code)) {
    console.warn('[OAUTH] Duplicate code blocked by in-memory lock — same process, second request ignored.');
    return res.redirect(`${FRONTEND}/login?error=oauth_retry`);
  }
  _inFlightOAuthCodes.add(code);
  // Auto-clean from in-memory set after 30s to avoid memory leak on unusual retries
  setTimeout(() => _inFlightOAuthCodes.delete(code), 30_000);

  // Layer 2: cross-instance lock via MongoDB unique index
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
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false, state: false }));

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
router.get('/facebook', passport.authenticate('facebook', { scope: ['public_profile', 'email'], session: false, state: false }));

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
