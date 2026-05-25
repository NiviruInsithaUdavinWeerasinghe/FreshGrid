const User = require('../models/User');
const Product = require('../models/Product');

const Offer = require('../models/Offer');

// ─── GET /api/cart ─────────────────────────────────────────────────────────────
// Returns the authenticated user's cart with populated product details and applied offers
const getCart = async (req, res) => {
  try {
    // If an Admin accidentally triggers a cart fetch (e.g. visiting storefront), return an empty cart
    if (req.user.role === 'admin') {
      return res.json({ success: true, data: [] });
    }

    const user = await User.findById(req.user._id)
      .populate({
        path: 'cart.productId',
        model: 'Product',
        select: 'name description price images category unit weightPerUnit',
      })
      .populate({
        path: 'cart.offerId',
        model: 'Offer',
        populate: {
          path: 'config.bundleProducts.productId',
          model: 'Product'
        }
      });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Fetch active MULTI_BUY offers to apply dynamically
    const now = new Date();
    const activeMultiBuys = await Offer.find({
      isActive: true,
      offerType: 'MULTI_BUY',
      validFrom: { $lte: now },
      validTo: { $gte: now }
    });

    const multiBuyMap = {};
    activeMultiBuys.forEach(offer => {
      multiBuyMap[offer.config.targetProductId.toString()] = offer;
    });

    const cartItems = user.cart
      .filter(item => item.productId || item.offerId)
      .map(item => {
        if (item.offerId && item.offerId.offerType === 'BUNDLE_PACKAGE') {
          // Map bundle to look like a product for the frontend
          const offer = item.offerId;
          const totalWeight = offer.config.bundleProducts.reduce((sum, bp) => {
            return sum + (bp.productId ? (bp.productId.weightPerUnit || 1) * bp.quantity : 0);
          }, 0);

          return {
            productId: offer._id, // frontend uses productId
            offerId: offer._id,
            quantity: item.quantity,
            product: {
              _id: offer._id,
              name: offer.title,
              description: offer.config.description || 'Special Bundle Package',
              price: offer.config.bundlePackagePrice,
              images: [offer.config.image || 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&q=80&w=600'],
              category: 'Special Offers',
              unit: 'package',
              weightPerUnit: totalWeight,
              isOffer: true
            }
          };
        }

        // Standard product
        let currentPrice = item.productId.price;
        const matchingMultiBuy = multiBuyMap[item.productId._id.toString()];
        
        if (matchingMultiBuy && item.quantity >= matchingMultiBuy.config.minQuantity) {
          currentPrice = matchingMultiBuy.config.discountedUnitPrice;
        }

        return {
          productId: item.productId._id,
          quantity: item.quantity,
          product: {
            ...item.productId.toObject(),
            price: currentPrice, // Override with multi-buy price if applicable
            originalPrice: item.productId.price // Send original price for UI if needed
          },
        };
      });

    res.json({ success: true, data: cartItems });
  } catch (err) {
    console.error('getCart error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── POST /api/cart ────────────────────────────────────────────────────────────
// Adds a product or bundle offer to the cart
const addToCart = async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ success: false, message: 'productId is required.' });
  }

  try {
    let isOffer = false;
    let item = await Product.findById(productId);
    
    if (!item) {
      item = await Offer.findById(productId);
      if (item) isOffer = true;
    }

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    const user = await User.findById(req.user._id);
    let existingItem;
    if (isOffer) {
      existingItem = user.cart.find(ci => ci.offerId?.toString() === productId.toString());
    } else {
      existingItem = user.cart.find(ci => ci.productId?.toString() === productId.toString());
    }

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      if (isOffer) {
        user.cart.push({ offerId: productId, quantity: 1 });
      } else {
        user.cart.push({ productId, quantity: 1 });
      }
    }

    await user.save();
    return getCart(req, res);
  } catch (err) {
    console.error('addToCart error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── PUT /api/cart/:productId ──────────────────────────────────────────────────
// Sets an existing cart item's quantity to a specific value
const updateCartItem = async (req, res) => {
  const { productId } = req.params; // Can be a product or offer ID
  const { quantity } = req.body;

  if (quantity === undefined) {
    return res.status(400).json({ success: false, message: 'quantity is required.' });
  }

  try {
    const user = await User.findById(req.user._id);
    const itemIndex = user.cart.findIndex(
      item => item.productId?.toString() === productId.toString() || item.offerId?.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not in cart.' });
    }

    if (quantity <= 0) {
      user.cart.splice(itemIndex, 1);
    } else {
      user.cart[itemIndex].quantity = quantity;
    }

    await user.save();
    return getCart(req, res);
  } catch (err) {
    console.error('updateCartItem error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── DELETE /api/cart/:productId ───────────────────────────────────────────────
// Completely removes an item from the cart
const removeFromCart = async (req, res) => {
  const { productId } = req.params; // Can be a product or offer ID

  try {
    const user = await User.findById(req.user._id);
    const itemIndex = user.cart.findIndex(
      item => item.productId?.toString() === productId.toString() || item.offerId?.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not in cart.' });
    }

    user.cart.splice(itemIndex, 1);
    await user.save();
    return getCart(req, res);
  } catch (err) {
    console.error('removeFromCart error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── DELETE /api/cart ──────────────────────────────────────────────────────────
// Clears all items from the cart
const clearCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.cart = [];
    await user.save();
    res.json({ success: true, data: [] });
  } catch (err) {
    console.error('clearCart error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
