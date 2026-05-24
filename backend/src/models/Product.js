const mongoose = require('mongoose'); // Import Mongoose to define and interact with the MongoDB schema

// ─── Schema Definition ─────────────────────────────────────────────────────────

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'], // Validation: name must be provided
      trim: true,                                    // Strip leading/trailing whitespace automatically
    },

    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },

    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'], // Prevent negative prices at the DB level
    },

    // Stored as an array so multiple images can be supported in the future.
    // Cloudinary URLs are pushed here by the upload middleware.
    images: {
      type: [String],
      default: [],
    },

    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
    },

    unit: {
      type: String,
      enum: ['kg', 'g', 'L', 'ml', 'piece', 'dozen', 'pack'],
      default: 'kg',
      required: true,
    },

    weightPerUnit: {
      type: Number,
      required: [true, 'Weight per unit (in kg) is required for delivery calculation'],
      min: [0.001, 'Weight must be at least 1 gram (0.001 kg)'],
    },

    inStock: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields managed by Mongoose
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────

productSchema.index({ name: 'text', category: 'text', description: 'text' });

// ─── Model ─────────────────────────────────────────────────────────────────────

// Compile the schema into a Model. Mongoose will use the 'products' collection in MongoDB.
const Product = mongoose.model('Product', productSchema);

module.exports = Product; // Export so services and controllers can import and query this model
