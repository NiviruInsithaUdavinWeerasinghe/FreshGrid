const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous sessions for now, though we can link to User later
  },
  title: {
    type: String,
    required: false
  },
  sessionId: {
    type: String,
    required: true
  },
  history: [
    {
      role: {
        type: String,
        enum: ['user', 'model', 'function'],
        required: true
      },
      parts: [
        {
          text: String,
          functionCall: {
            name: String,
            args: mongoose.Schema.Types.Mixed
          },
          functionResponse: {
            name: String,
            response: mongoose.Schema.Types.Mixed
          }
        }
      ],
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
