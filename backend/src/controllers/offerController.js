const Offer = require('../models/Offer');
const User = require('../models/User');
const emailService = require('../services/emailService');

exports.createOffer = async (req, res) => {
  try {
    let payload = { ...req.body };
    if (payload.config && typeof payload.config === 'string') {
      payload.config = JSON.parse(payload.config);
    }
    if (req.file) {
      if (!payload.config) payload.config = {};
      payload.config.image = req.file.path;
    }
    const offer = await Offer.create(payload);

    // After successfully creating an offer, if it is active, send promotion emails to subscribers asynchronously
    if (offer.isActive) {
      // Populate offer to get product details for the email template
      Offer.findById(offer._id)
        .populate('config.targetProductId')
        .populate('config.bundleProducts.productId')
        .then((populatedOffer) => {
          User.find({ isSubscribedToPromotions: true })
            .select('email')
            .then((subscribers) => {
              const emails = subscribers.map(sub => sub.email);
              if (emails.length > 0 && populatedOffer) {
                emailService.sendPromotionEmails(emails, populatedOffer).catch(console.error);
              }
            })
            .catch(console.error);
        })
        .catch(console.error);
    }

    res.status(201).json({ success: true, data: offer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getOffers = async (req, res) => {
  try {
    const offers = await Offer.find().sort('-createdAt').populate('config.targetProductId').populate('config.bundleProducts.productId');
    res.json({ success: true, data: offers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getActiveOffers = async (req, res) => {
  try {
    const now = new Date();
    const offers = await Offer.find({
      isActive: true,
      validFrom: { $lte: now },
      validTo: { $gte: now }
    }).populate('config.targetProductId').populate('config.bundleProducts.productId');
    res.json({ success: true, data: offers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateOffer = async (req, res) => {
  try {
    let payload = { ...req.body };
    if (payload.config && typeof payload.config === 'string') {
      payload.config = JSON.parse(payload.config);
    }
    if (req.file) {
      if (!payload.config) payload.config = {};
      payload.config.image = req.file.path;
    }
    const offer = await Offer.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!offer) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: offer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);
    if (!offer) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
