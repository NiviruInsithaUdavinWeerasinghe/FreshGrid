const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      // Nullable for OAuth-only users
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isSubscribedToPromotions: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: null,
    },
    verificationTokenExpires: {
      type: Date,
      default: null,
    },
    provider: {
      type: String,
      enum: ['local', 'google', 'facebook'],
      default: 'local',
    },
    googleId: {
      type: String,
      default: null,
    },
    facebookId: {
      type: String,
      default: null,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    passkeys: [
      {
        credentialID: { type: String, required: true },
        credentialPublicKey: { type: String, required: true },
        counter: { type: Number, default: 0 },
        transports: [String],
      },
    ],

    cart: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          default: null,
        },
        offerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Offer',
          default: null,
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
      },
    ],

    homeLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      address: { type: String, default: null },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
