// productController.js — HTTP request handlers for product-related API endpoints.
// Controllers are intentionally kept thin: they handle request/response concerns
// (parsing inputs, setting status codes, formatting JSON) and delegate all
// business/database logic to the productService layer.

const productService = require('../services/productService'); // Import the service layer that handles DB operations
const { estimateProductMetrics } = require('../services/geminiService');

// ─── Create ────────────────────────────────────────────────────────────────────

/**
 * POST /api/products
 * Creates a new product. Accepts multipart/form-data so an image file can be
 * uploaded alongside the product fields in the same request.
 */
const addProduct = async (req, res) => {
    try {
        const productData = req.body; // Extract all text fields sent in the request body

        // If an image was uploaded, Multer-Cloudinary processes it and attaches
        // the resulting Cloudinary URL to req.file.path before this handler runs.
        if (req.file) {
            productData.images = [req.file.path]; // Store the Cloudinary URL as the first element of the images array
        }

        const newProduct = await productService.createProduct(productData); // Delegate persistence to the service layer
        res.status(201).json({ success: true, data: newProduct });          // 201 Created — return the saved document
    } catch (error) {
        // Catch any unexpected errors (validation failures, DB connection issues, etc.)
        res.status(500).json({ success: false, message: error.message });   // 500 Internal Server Error
    }
};

// ─── Read ──────────────────────────────────────────────────────────────────────

/**
 * GET /api/products
 * Fetches all products from the database, sorted newest-first,
 * with the category name populated.
 */
const getProducts = async (req, res) => {
    try {
        const products = await productService.getAllProducts();          // Retrieve all product documents via the service
        res.status(200).json({ success: true, data: products });        // 200 OK — return the array of products
    } catch (error) {
        res.status(500).json({ success: false, message: error.message }); // 500 Internal Server Error
    }
};

// ─── Update ────────────────────────────────────────────────────────────────────

/**
 * PUT /api/products/:id
 * Updates an existing product identified by its MongoDB ObjectId.
 * Supports optional image replacement via a new file upload.
 */
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;   // Extract the product ObjectId from the URL parameter (:id)
        const updateData = req.body; // Collect only the fields that need to change

        // If a new image file was uploaded, overwrite the existing images array
        // with the fresh Cloudinary URL provided by Multer-Cloudinary.
        if (req.file) {
            updateData.images = [req.file.path]; // Replace previous image URL with the newly uploaded one
        }

        const updatedProduct = await productService.updateProduct(id, updateData); // Apply the update via the service
        res.status(200).json({ success: true, data: updatedProduct });             // 200 OK — return the updated document
    } catch (error) {
        console.error('Update Product Error:', error);
        res.status(500).json({ success: false, message: error.message }); // 500 Internal Server Error
    }
};

// ─── Delete ────────────────────────────────────────────────────────────────────

/**
 * DELETE /api/products/:id
 * Permanently removes a product from the database by its MongoDB ObjectId.
 * Note: this does NOT delete the associated image from Cloudinary (can be added later).
 */
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;                    // Extract the product ObjectId from the URL parameter (:id)
        await productService.deleteProduct(id);        // Delegate the deletion to the service layer (result is not needed)
        res.status(200).json({ success: true, message: 'Product deleted successfully' }); // 200 OK — confirm deletion
    } catch (error) {
        res.status(500).json({ success: false, message: error.message }); // 500 Internal Server Error
    }
};

// ─── Exports ───────────────────────────────────────────────────────────────────

// Export all four controller functions so the product router can map them to HTTP verbs and paths.
const estimateMetrics = async (req, res) => {
  try {
    const { name, category, description } = req.body;

    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Name and Category are required for AI estimation.' });
    }

    const metrics = await estimateProductMetrics(name, category, description || '');

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error estimating metrics:', error);
    res.status(500).json({ success: false, message: 'Failed to auto-detect metrics. Please enter them manually.' });
  }
};

module.exports = { addProduct, getProducts, updateProduct, deleteProduct, estimateMetrics };