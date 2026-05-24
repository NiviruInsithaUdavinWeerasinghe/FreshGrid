const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      name: { type: String, required: true },
      image: { type: String },
      quantity: { type: Number, required: true },
      priceAtPurchase: { type: Number, required: true }
    }
  ],
  deliveryDetails: {
    address: { type: String, required: true },
    distanceKm: { type: Number, required: true },
    baseFee: { type: Number, required: true },
    weightRate: { type: Number, required: true },
    totalWeight: { type: Number, required: true }
  },
  totals: {
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    total: { type: Number, required: true }
  },
  paymentMethod: {
    type: String,
    enum: ['Card', 'Cash'],
    default: 'Card'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  status: {
    type: String,
    enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Processing'
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
