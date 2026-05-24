const Order = require('../models/Order');
const User = require('../models/User');

// ─── POST /api/orders ─────────────────────────────────────────────────────────
// Create a new order and clear the user's cart
const createOrder = async (req, res) => {
  try {
    const { items, deliveryDetails, totals, paymentMethod, paymentStatus } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in order' });
    }

    const order = new Order({
      user: req.user._id,
      items,
      deliveryDetails,
      totals,
      paymentMethod: paymentMethod || 'Card',
      paymentStatus: paymentStatus || 'Pending'
    });

    await order.save();

    // Clear the user's cart
    const user = await User.findById(req.user._id);
    if (user) {
      user.cart = [];
      await user.save();
    }

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    console.error('createOrder error:', err);
    res.status(500).json({ success: false, message: 'Server error while creating order.' });
  }
};

// ─── GET /api/orders ──────────────────────────────────────────────────────────
// Get all orders for the authenticated user
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name images category unit');

    res.json({ success: true, data: orders });
  } catch (err) {
    console.error('getUserOrders error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching orders.' });
  }
};

// ─── GET /api/orders/all ──────────────────────────────────────────────────────
// Get all orders across the platform (Admin only)
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('items.product', 'name images category unit');

    res.json({ success: true, data: orders });
  } catch (err) {
    console.error('getAllOrders error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching all orders.' });
  }
};

// ─── PUT /api/orders/:id/status ───────────────────────────────────────────────
// Update the status of an order (Admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('user', 'name email').populate('items.product', 'name images category unit');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    console.error('updateOrderStatus error:', err);
    res.status(500).json({ success: false, message: 'Server error updating order status.' });
  }
};

// ─── PUT /api/orders/:id/payment ──────────────────────────────────────────────
// Update the payment status of an order (Admin only)
const updateOrderPayment = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    
    if (!['Pending', 'Paid', 'Failed', 'Refunded'].includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status value' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true, runValidators: true }
    ).populate('user', 'name email').populate('items.product', 'name images category unit');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    console.error('updateOrderPayment error:', err);
    res.status(500).json({ success: false, message: 'Server error updating payment status.' });
  }
};

module.exports = { createOrder, getUserOrders, getAllOrders, updateOrderStatus, updateOrderPayment };
