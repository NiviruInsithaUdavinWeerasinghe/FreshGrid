const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    offerType: {
      type: String,
      enum: ['DELIVERY_SUBSIDY_OR_WEIGHT', 'MULTI_BUY', 'BUNDLE_PACKAGE'],
      required: true,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validTo: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    showBanner: {
      type: Boolean,
      default: false,
    },
    config: {
      // SUBSIDY
      minCartValue: { type: Number, default: null },
      minCartWeightKg: { type: Number, default: null },
      discountedWeightRate: { type: Number, default: null },
      waiveBaseFee: { type: Boolean, default: false },
      
      // MULTI_BUY
      targetProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
      minQuantity: { type: Number, default: null },
      discountedUnitPrice: { type: Number, default: null },
      
      // BUNDLE_PACKAGE
      bundleProducts: [
        {
          productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
          quantity: { type: Number, default: 1 }
        }
      ],
      bundlePackagePrice: { type: Number, default: null },
      
      // For display in Shop
      image: { type: String, default: null },
      description: { type: String, default: null }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Offer', offerSchema);
