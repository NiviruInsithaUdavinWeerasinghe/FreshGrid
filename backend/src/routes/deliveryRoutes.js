const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { calculateFee } = require('../controllers/deliveryController');

// All delivery routes require authentication
router.post('/calculate', protect, calculateFee);

module.exports = router;
