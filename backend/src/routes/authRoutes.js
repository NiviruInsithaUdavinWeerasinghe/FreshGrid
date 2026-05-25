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

const _inFlightOAuthPromises = new Map();

// Helper to handle OAuth authentication and deduplication
const handleOAuthCallback = (strategy) => {
  return (req, res, next) => {
    const code = req.query.code;
    
    if (!code) {
      // If there's no code, it might be an error redirect from the provider
      return passport.authenticate(strategy, { session: false }, (err, user, info) => {
        if (err || !user) {
          console.error(`[${strategy.toUpperCase()}] OAuth error without code:`, err?.message || info?.message);
          return res.redirect(`${FRONTEND}/login?error=${strategy}_auth_failed`);
        }
        res.redirect(`${FRONTEND}/auth/callback?token=${makeJwt(user._id)}`);
      })(req, res, next);
    }

    // If this code is already being processed, wait for that promise to resolve
    if (_inFlightOAuthPromises.has(code)) {
      console.warn(`[OAUTH] Duplicate code detected for ${strategy}, waiting for primary request...`);
      _inFlightOAuthPromises.get(code)
        .then(user => {
          res.redirect(`${FRONTEND}/auth/callback?token=${makeJwt(user._id)}`);
        })
        .catch(err => {
          res.redirect(`${FRONTEND}/login?error=${strategy}_auth_failed`);
        });
      return;
    }

    // Create a new promise for this code
    const authPromise = new Promise((resolve, reject) => {
      passport.authenticate(strategy, { session: false }, async (err, user, info) => {
        if (err || !user) {
          reject(err || new Error(info?.message || 'Auth failed'));
        } else {
          try {
            // Layer 2: cross-instance lock via MongoDB unique index (for Render multiple instances)
            await OAuthCode.create({ code });
            resolve(user);
          } catch (dbErr) {
            if (dbErr.code === 11000) {
              console.warn('[OAUTH] Duplicate code blocked by MongoDB lock — another instance already handled it.');
              // If another instance handled it, we can't easily get the user from it here,
              // but we can reject, which will send them to the login page.
              // Actually, since they might be the same user on a different instance, redirecting to login is a fallback.
              reject(new Error('Handled by another instance'));
            } else {
              reject(dbErr);
            }
          }
        }
      })(req, res, next);
    });

    _inFlightOAuthPromises.set(code, authPromise);

    // Cleanup memory after 30 seconds
    setTimeout(() => _inFlightOAuthPromises.delete(code), 30000);

    authPromise
      .then(user => {
        res.redirect(`${FRONTEND}/auth/callback?token=${makeJwt(user._id)}`);
      })
      .catch(err => {
        console.error(`[${strategy.toUpperCase()}] OAuth error:`, err?.message);
        res.redirect(`${FRONTEND}/login?error=${strategy}_auth_failed`);
      });
  };
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

router.get('/google/callback', handleOAuthCallback('google'));

// ─── Facebook OAuth ────────────────────────────────────────────────────────────
router.get('/facebook', passport.authenticate('facebook', { scope: ['public_profile', 'email'], session: false, state: false }));

router.get('/facebook/callback', handleOAuthCallback('facebook'));

module.exports = router;
