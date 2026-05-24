const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { createOrder, getUserOrders, getAllOrders, updateOrderStatus, updateOrderPayment } = require('../controllers/orderController');

// All order routes are protected
router.use(protect);

router.route('/')
  .post(createOrder)
  .get(getUserOrders);

// Admin routes
router.get('/all', adminOnly, getAllOrders);
router.put('/:id/status', adminOnly, updateOrderStatus);
router.put('/:id/payment', adminOnly, updateOrderPayment);

module.exports = router;
