const { getDistance } = require('../services/googleMapsService');
const { calculateDeliveryFee } = require('../utils/deliveryCalculator');
const Product = require('../models/Product');

// Fixed store location (Katubedda, Sri Lanka)
const STORE_LAT = 6.7991460;
const STORE_LNG = 79.8980250;

const Offer = require('../models/Offer');

/**
 * Calculates delivery fee dynamically based on destination and cart items.
 * Expects { destLat, destLng, cartItems: [{ productId, quantity }], cartSubtotal: Number } in req.body
 */
const calculateFee = async (req, res) => {
  try {
    const { destLat, destLng, cartItems, cartSubtotal = 0 } = req.body;

    if (!destLat || !destLng) {
      return res.status(400).json({ success: false, message: 'Destination coordinates are required.' });
    }

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items are required to calculate weight.' });
    }

    // 1. Calculate total weight
    let totalWeightKg = 0;
    
    // Fetch all products and offers
    const productIds = cartItems.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const offers = await Offer.find({ _id: { $in: productIds }, offerType: 'BUNDLE_PACKAGE' }).populate('config.bundleProducts.productId');
    
    const productMap = {};
    products.forEach(p => productMap[p._id.toString()] = p);
    
    const offerMap = {};
    offers.forEach(o => offerMap[o._id.toString()] = o);

    cartItems.forEach(item => {
      const product = productMap[item.productId.toString()];
      if (product && product.weightPerUnit) {
        totalWeightKg += product.weightPerUnit * item.quantity;
      } else {
        const offer = offerMap[item.productId.toString()];
        if (offer && offer.offerType === 'BUNDLE_PACKAGE') {
          const bundleWeight = offer.config.bundleProducts.reduce((sum, bp) => {
            return sum + (bp.productId ? (bp.productId.weightPerUnit || 1) * bp.quantity : 0);
          }, 0);
          totalWeightKg += bundleWeight * item.quantity;
        }
      }
    });

    if (totalWeightKg === 0) {
      // Fallback weight if no products have weights defined
      totalWeightKg = 1; 
    }

    // 2. Evaluate Subsidies
    const now = new Date();
    const subsidies = await Offer.find({
      isActive: true,
      offerType: 'DELIVERY_SUBSIDY_OR_WEIGHT',
      validFrom: { $lte: now },
      validTo: { $gte: now }
    });

    let overrides = {};
    subsidies.forEach(sub => {
      // Apply if minimums are met (treating null as 0 threshold)
      const meetsValue = sub.config.minCartValue ? cartSubtotal >= sub.config.minCartValue : true;
      const meetsWeight = sub.config.minCartWeightKg ? totalWeightKg >= sub.config.minCartWeightKg : true;
      
      if (meetsValue && meetsWeight) {
        if (sub.config.waiveBaseFee) overrides.waiveBaseFee = true;
        if (sub.config.discountedWeightRate !== null && sub.config.discountedWeightRate !== undefined) {
          // keep the lowest possible rate if multiple subsidies overlap
          if (overrides.discountedWeightRate === undefined || sub.config.discountedWeightRate < overrides.discountedWeightRate) {
            overrides.discountedWeightRate = sub.config.discountedWeightRate;
          }
        }
      }
    });

    // 3. Calculate distance
    const distanceKm = await getDistance(STORE_LAT, STORE_LNG, destLat, destLng);

    // 4. Calculate fee
    const fee = calculateDeliveryFee(distanceKm, totalWeightKg, overrides);
    
    const finalBase = overrides.waiveBaseFee ? 0 : 150;
    const finalWeightRate = overrides.discountedWeightRate !== undefined ? overrides.discountedWeightRate : 30;

    res.json({
      success: true,
      data: {
        distanceKm: Number(distanceKm.toFixed(2)),
        totalWeightKg: Number(totalWeightKg.toFixed(2)),
        fee,
        breakdown: {
          base: finalBase,
          originalBase: 150,
          distanceCost: Number((distanceKm * 20).toFixed(2)),
          weightCost: Number((totalWeightKg * finalWeightRate).toFixed(2)),
          weightRateUsed: finalWeightRate,
          originalWeightRate: 30
        }
      }
    });

  } catch (error) {
    console.error('Calculate delivery fee error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to calculate delivery fee.' });
  }
};

module.exports = {
  calculateFee,
};
