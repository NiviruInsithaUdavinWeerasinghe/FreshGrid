const express = require('express');
const router = express.Router();
const { createOffer, getOffers, getActiveOffers, updateOffer, deleteOffer } = require('../controllers/offerController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/active', getActiveOffers);

router.use(protect);
router.use(adminOnly);

const { upload } = require('../config/cloudinary');

router.route('/')
  .post(upload.single('image'), createOffer)
  .get(getOffers);

router.route('/:id')
  .put(upload.single('image'), updateOffer)
  .delete(deleteOffer);

module.exports = router;
