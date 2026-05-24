const cloudinary = require('cloudinary').v2;                          // Import Cloudinary SDK and use the v2 API
const { CloudinaryStorage } = require('multer-storage-cloudinary');    // Import CloudinaryStorage engine to connect multer with Cloudinary
const multer = require('multer');                                       // Import multer for handling multipart/form-data (file uploads)
require('dotenv').config();                                             // Load environment variables from the .env file into process.env

cloudinary.config({                                                     // Configure the Cloudinary SDK with credentials from environment variables
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,                       // Your Cloudinary cloud name (unique account identifier)
  api_key: process.env.CLOUDINARY_API_KEY,                             // Your Cloudinary API key for authentication
  api_secret: process.env.CLOUDINARY_API_SECRET,                       // Your Cloudinary API secret (keep this private)
});                                                                     // End of Cloudinary config block

const storage = new CloudinaryStorage({                                 // Create a multer storage engine backed by Cloudinary
  cloudinary: cloudinary,                                               // Pass the configured Cloudinary instance to the storage engine
  params: {                                                             // Define upload parameters applied to every file stored via this engine
    folder: 'FreshGrid/Products',                                       // Cloudinary folder path where uploaded product images will be saved
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],                   // Whitelist of accepted image formats; any other type will be rejected
  },                                                                    // End of params object
});                                                                     // End of CloudinaryStorage configuration

const upload = multer({ storage: storage });                            // Create the multer middleware instance using the Cloudinary storage engine

module.exports = { cloudinary, upload };                                // Export the configured cloudinary instance and the upload middleware for use in routes