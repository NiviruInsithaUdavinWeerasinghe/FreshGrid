// productRoutes.js — Defines the REST API endpoints for the product resource.
// All routes are mounted under a base path (e.g. /api/products) in server.js,
// so the paths declared here are relative to that base.

const express = require('express');                                           // Import Express to access the Router factory
const router = express.Router();                                              // Create a modular, mountable route handler
const productController = require('../controllers/productController');         // Import controller functions that handle request logic
const { upload } = require('../config/cloudinary');                           // Import the Multer-Cloudinary middleware for file upload handling

const { protect, adminOnly } = require('../middleware/auth');                  // Import authorization middlewares

// ─── POST /api/products ────────────────────────────────────────────────────────
// Creates a new product. The request must be sent as multipart/form-data
// so that both the text fields and the image file arrive in a single request.
// 'upload.single('image')' processes exactly one file from the 'image' form field
// and attaches the resulting Cloudinary URL to req.file before the controller runs.
// Note: 'image' must match the field name used in the React frontend's FormData object.
router.post('/', protect, adminOnly, upload.single('image'), productController.addProduct);

// ─── POST /api/products/estimate-metrics ───────────────────────────────────────
router.post('/estimate-metrics', protect, adminOnly, productController.estimateMetrics);

// ─── GET /api/products ─────────────────────────────────────────────────────────
// Retrieves all products from the database, sorted newest-first.
// No file upload middleware is needed here — this is a plain JSON response.
router.get('/', productController.getProducts);

// ─── PUT /api/products/:id ─────────────────────────────────────────────────────
// Updates an existing product identified by its MongoDB ObjectId (:id).
// Optionally accepts a new image file; if none is provided, the existing image is kept.
// 'upload.single('image')' is included so partial updates with a new image work seamlessly.
router.put('/:id', protect, adminOnly, upload.single('image'), productController.updateProduct);

// ─── DELETE /api/products/:id ──────────────────────────────────────────────────
// Permanently deletes a product by its MongoDB ObjectId (:id).
// No upload middleware needed — deletion does not involve file handling.
router.delete('/:id', protect, adminOnly, productController.deleteProduct);

// Export the configured router so server.js can mount it at the /api/products path.
module.exports = router;