const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { optionalAuth } = require('../middleware/auth');

// Using optionalAuth to link chats to users if logged in, but allowing anonymous access
router.post('/', optionalAuth, chatController.processChatMessage);
router.get('/history', optionalAuth, chatController.getHistory);
router.get('/:sessionId', optionalAuth, chatController.getSession);

module.exports = router;
