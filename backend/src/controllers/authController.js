const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

const User = require('../models/User');
const Admin = require('../models/Admin');
const emailService = require('../services/emailService');

// Relying Party configs for Passkeys on localhost
const rpName = 'FreshGrid';
const rpID = 'localhost';
const origin = process.env.FRONTEND_URL || 'http://localhost:5173';

// Helpers
const generateToken = (id, role = 'customer') => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Temp store for WebAuthn challenges (in-memory for simple dev setup)
const challengeStore = new Map(); // key: userId/email/sessionId, value: challenge

const formatUser = (user) => {
  return {
    id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role || 'customer',
    isVerified: user.isVerified !== undefined ? user.isVerified : true,
    provider: user.provider || 'local',
    profilePicture: user.profilePicture,
    homeLocation: user.homeLocation,
    hasPasskey: user.passkeys ? user.passkeys.length > 0 : false,
    linkedMethods: {
      password: !!user.passwordHash,
      google: !!user.googleId,
      facebook: !!user.facebookId,
      passkey: user.passkeys ? user.passkeys.length > 0 : false,
    },
  };
};

// ─── Customer Authentication ───────────────────────────────────────────────────

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const emailLower = email.toLowerCase();
    const userExists = await User.findOne({ email: emailLower });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email.' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const user = new User({
      name,
      email: emailLower,
      passwordHash,
      verificationToken,
      verificationTokenExpires,
      isVerified: false,
    });

    await user.save();

    // Dev Verification Link Logging
    const verifyUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/verify-email/${verificationToken}`;
    console.log('\n==================================================');
    console.log('✉️  FreshGrid Email Verification Link (Dev Mode):');
    console.log(verifyUrl);
    console.log('==================================================\n');

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email console for the verification link.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?verified=false&error=invalid_or_expired`);
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/login?verified=false&error=server_error`);
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const emailLower = email.toLowerCase();
    const user = await User.findOne({ email: emailLower });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.provider !== 'local' || !user.passwordHash) {
      return res.status(400).json({
        success: false,
        message: `This account is linked via ${user.provider}. Please log in using that method.`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your email has not been verified yet. Please check your developer console/inbox.',
      });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    // req.user has already been resolved in protect middleware
    res.status(200).json({
      success: true,
      user: formatUser(req.user),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Admin Authentication ──────────────────────────────────────────────────────

const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const admin = await Admin.findOne({ username: username.trim() });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    res.status(200).json({
      success: true,
      token: generateToken(admin._id, 'admin'),
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: 'admin',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── WebAuthn / Passkeys Flow ─────────────────────────────────────────────────

const registerPasskeyBegin = async (req, res) => {
  try {
    // User must be authenticated to link a Passkey to their account
    const user = req.user;

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: Buffer.from(user._id.toString()),
      userName: user.email,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
    });

    // Save challenge in-memory associated with user id
    challengeStore.set(`reg_${user._id}`, options.challenge);

    res.json(options);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const registerPasskeyFinish = async (req, res) => {
  try {
    const user = req.user;
    const body = req.body;

    const expectedChallenge = challengeStore.get(`reg_${user._id}`);
    if (!expectedChallenge) {
      return res.status(400).json({ success: false, message: 'Registration challenge not found.' });
    }

    // Clean up challenge
    challengeStore.delete(`reg_${user._id}`);

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });

    if (verification.verified && verification.registrationInfo) {
      const regInfo = verification.registrationInfo;
      const credential = regInfo.credential || {};
      const credentialID = credential.id || regInfo.credentialID;
      const credentialPublicKey = credential.publicKey || regInfo.credentialPublicKey;
      const counter = credential.counter !== undefined ? credential.counter : regInfo.counter;

      if (!credentialID || !credentialPublicKey) {
        return res.status(400).json({ success: false, message: 'Invalid registration info received from authenticator.' });
      }

      const credentialIDBase64 = typeof credentialID === 'string' ? credentialID : Buffer.from(credentialID).toString('base64url');
      const credentialPublicKeyBase64 = Buffer.from(credentialPublicKey).toString('base64url');

      // Check if credential already exists to prevent duplicate entries
      const credentialExists = user.passkeys.some(
        (pk) => pk.credentialID === credentialIDBase64
      );

      if (!credentialExists) {
        user.passkeys.push({
          credentialID: credentialIDBase64,
          credentialPublicKey: credentialPublicKeyBase64,
          counter,
          transports: body.response.transports || credential.transports || [],
        });
        await user.save();
      }

      return res.json({ success: true, message: 'Passkey registered successfully!' });
    }

    res.status(400).json({ success: false, message: 'Passkey verification failed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const loginPasskeyBegin = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required to fetch passkeys.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passkeys || user.passkeys.length === 0) {
      return res.status(404).json({ success: false, message: 'No passkeys found for this account.' });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.passkeys.map((pk) => ({
        id: pk.credentialID,
        type: 'public-key',
        transports: pk.transports,
      })),
      userVerification: 'preferred',
    });

    challengeStore.set(`auth_${user._id}`, options.challenge);

    res.json({
      options,
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const loginPasskeyFinish = async (req, res) => {
  try {
    const { response, userId } = req.body;

    if (!response || !userId) {
      return res.status(400).json({ success: false, message: 'Missing passkey authentication response parameters.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const expectedChallenge = challengeStore.get(`auth_${user._id}`);
    if (!expectedChallenge) {
      return res.status(400).json({ success: false, message: 'Authentication challenge not found.' });
    }

    // Clean up challenge
    challengeStore.delete(`auth_${user._id}`);

    // Retrieve active passkey matching credential ID from frontend
    const passkey = user.passkeys.find((pk) => pk.credentialID === response.id);
    if (!passkey) {
      return res.status(400).json({ success: false, message: 'Matching passkey credential not found on account.' });
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: passkey.credentialID,
        publicKey: Buffer.from(passkey.credentialPublicKey, 'base64url'),
        counter: passkey.counter,
        transports: passkey.transports,
      },
      requireUserVerification: false,
    });

    if (verification.verified) {
      // Update counter to avoid replay attacks
      passkey.counter = verification.authenticationInfo.newCounter;
      await user.save();

      return res.json({
        success: true,
        token: generateToken(user._id),
        user: formatUser(user),
      });
    }

    res.status(400).json({ success: false, message: 'Authentication verification failed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, homeLocation } = req.body;
    const user = req.user;

    if (name && name.trim()) {
      user.name = name.trim();
    }

    if (homeLocation) {
      user.homeLocation = {
        lat: homeLocation.lat || user.homeLocation?.lat,
        lng: homeLocation.lng || user.homeLocation?.lng,
        address: homeLocation.address || user.homeLocation?.address,
      };
    }

    if (req.file) {
      user.profilePicture = req.file.path;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    // If user has a password set, require current password and verify it
    if (user.passwordHash) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to change password.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      }
      const isSame = await bcrypt.compare(newPassword, user.passwordHash);
      if (isSame) {
        return res.status(400).json({ success: false, message: 'New password cannot be the same as your current password.' });
      }
    }

    // Update password
    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Ensure local provider is set if they set password
    if (user.provider !== 'local') {
      user.provider = 'local';
    }

    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyPassword = async (req, res) => {
  try {
    const { currentPassword } = req.body;
    const user = req.user;

    if (!user.passwordHash) {
      return res.status(400).json({ success: false, message: 'No password set on this account.' });
    }

    if (!currentPassword) {
      return res.status(400).json({ success: false, message: 'Current password is required.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    res.status(200).json({ success: true, message: 'Password verified successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const unlinkPasskey = async (req, res) => {
  try {
    const user = req.user;
    user.passkeys = [];
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Passkey unlinked successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        provider: user.provider,
        profilePicture: user.profilePicture,
        hasPasskey: false,
        linkedMethods: {
          password: !!user.passwordHash,
          google: !!user.googleId,
          facebook: !!user.facebookId,
          passkey: false,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const subscribeToPromotions = async (req, res) => {
  try {
    const user = req.user;

    if (!user.email) {
      return res.status(400).json({ success: false, message: 'Your account does not have an email address associated with it.' });
    }

    if (user.isSubscribedToPromotions) {
      return res.status(400).json({ success: false, message: 'You are already subscribed to promotions!' });
    }

    user.isSubscribedToPromotions = true;
    await user.save();

    // Send Welcome Email asynchronously
    emailService.sendWelcomeEmail(user.email, user.name || 'VIP Member').catch(console.error);

    res.status(200).json({ success: true, message: 'Successfully subscribed to Fresh Club VIP promotions!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};
