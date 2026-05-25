const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Local Strategy for Customer Email & Password Auth
passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }
        if (!user.passwordHash) {
          return done(null, false, {
            message: 'Account registered with social login. Please sign in using Google or Facebook.',
          });
        }
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect email or password.' });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        proxy: true,
        state: false, // Disable session-based state — MemoryStore is per-instance on Render
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists by googleId
          let user = await User.findOne({ googleId: profile.id });
          if (user) {
            return done(null, user);
          }

          // Check if user exists by email (to link account)
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await User.findOne({ email: email.toLowerCase() });
            if (user) {
              user.googleId = profile.id;
              user.provider = 'google';
              if (!user.name) user.name = profile.displayName;
              await user.save();
              return done(null, user);
            }
          }

          // Otherwise create a new Google user
          user = new User({
            name: profile.displayName || 'Google User',
            email: email ? email.toLowerCase() : `${profile.id}@google.placeholder.com`,
            googleId: profile.id,
            provider: 'google',
            isVerified: true, // Google emails are pre-verified
          });
          await user.save();
          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );
}

// Facebook OAuth Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL,
        profileFields: ['id', 'displayName', 'emails'],
        proxy: true,
        state: false, // Disable session-based state — MemoryStore is per-instance on Render
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ facebookId: profile.id });
          if (user) {
            return done(null, user);
          }

          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await User.findOne({ email: email.toLowerCase() });
            if (user) {
              user.facebookId = profile.id;
              user.provider = 'facebook';
              if (!user.name) user.name = profile.displayName;
              await user.save();
              return done(null, user);
            }
          }

          user = new User({
            name: profile.displayName || 'Facebook User',
            email: email ? email.toLowerCase() : `${profile.id}@facebook.placeholder.com`,
            facebookId: profile.id,
            provider: 'facebook',
            isVerified: true, // Facebook verified is true
          });
          await user.save();
          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );
}

// Session Serialization (Required for Passport workflow redirections)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
