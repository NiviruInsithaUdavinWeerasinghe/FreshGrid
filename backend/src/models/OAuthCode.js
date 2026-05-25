const mongoose = require('mongoose');

// TTL-indexed collection to atomically deduplicate OAuth codes across all
// Render instances. MongoDB's unique index guarantees only ONE instance
// can insert a given code — all others get a duplicate key error (E11000).
const OAuthCodeSchema = new mongoose.Schema({
  code:      { type: String, required: true, unique: true },
  createdAt: { type: Date,   default: Date.now, expires: 300 }, // auto-delete after 5 min
});

module.exports = mongoose.model('OAuthCode', OAuthCodeSchema);
