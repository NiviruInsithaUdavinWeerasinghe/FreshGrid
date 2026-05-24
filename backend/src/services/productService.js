// productService.js — Business logic layer for product-related database operations.
// All direct interactions with the Product model are centralised here,
// keeping controllers thin and the data access pattern consistent.

const Product = require('../models/Product'); // Import the Product Mongoose model

// ─── Create ────────────────────────────────────────────────────────────────────

/**
 * Creates and persists a new product document in the database.
 * @param {Object} productData - Plain object containing the product fields (name, price, image, etc.)
 * @returns {Promise<Document>} The newly saved Mongoose document.
 */
const createProduct = async (productData) => {
    const product = new Product(productData); // Instantiate a new Product document from the provided data
    return await product.save();              // Persist the document to MongoDB and return it
};

// ─── Read ──────────────────────────────────────────────────────────────────────

/**
 * Retrieves all products, joining their category name via a populate call,
 * sorted so the most recently created products appear first.
 * @returns {Promise<Document[]>} Array of product documents with populated category.
 */
const getAllProducts = async () => {
    return await Product.find()                     // Fetch every product document from the collection
        .populate('category', 'name')               // Replace the category ObjectId with just the category's name field
        .sort({ createdAt: -1 });                   // Sort descending by creation date (newest first)
};

// ─── Update ────────────────────────────────────────────────────────────────────

/**
 * Finds a product by its MongoDB ObjectId and applies a partial or full update.
 * @param {string} id         - The MongoDB ObjectId string of the product to update.
 * @param {Object} updateData - Object containing only the fields that should change.
 * @returns {Promise<Document|null>} The updated document, or null if no match was found.
 */
const updateProduct = async (id, updateData) => {
    // { new: true } tells Mongoose to return the document *after* the update is applied,
    // rather than the original pre-update version.
    return await Product.findByIdAndUpdate(id, updateData, { returnDocument: 'after', runValidators: true });
};

// ─── Delete ────────────────────────────────────────────────────────────────────

/**
 * Permanently removes a product document from the database by its ObjectId.
 * @param {string} id - The MongoDB ObjectId string of the product to delete.
 * @returns {Promise<Document|null>} The deleted document, or null if no match was found.
 */
const deleteProduct = async (id) => {
    return await Product.findByIdAndDelete(id); // Locate and remove the document in one atomic operation
};

// ─── Exports ───────────────────────────────────────────────────────────────────

// Expose all service functions so controllers can import only what they need.
module.exports = {
    createProduct,
    getAllProducts,
    updateProduct,
    deleteProduct
};