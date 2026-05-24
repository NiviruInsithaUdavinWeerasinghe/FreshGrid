const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');

// All cart routes require authentication
router.get('/', protect, getCart);
router.post('/', protect, addToCart);
router.delete('/', protect, clearCart);
router.put('/:productId', protect, updateCartItem);
router.delete('/:productId', protect, removeFromCart);

module.exports = router;
