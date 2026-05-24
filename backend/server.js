const express = require('express'); // Import the express framework for building the server
const cors = require('cors'); // Import cors middleware to allow cross-origin requests
const dotenv = require('dotenv'); // Import dotenv to load environment variables from a .env file
const helmet = require('helmet'); // Security headers
const session = require('express-session'); // Required for passport oauth flow state
const passport = require('passport'); // Passport middleware framework
const rateLimit = require('express-rate-limit'); // API rate limiter
const connectDB = require('./src/config/db'); // Import the custom database connection function

dotenv.config(); // Load the environment variables from the .env file into process.env

// Import passport config to load strategies
require('./src/config/passport');

const app = express(); // Create an instance of the express application
const PORT = process.env.PORT || 5000; // Define the port, defaulting to 5000 if not set in environment

// Connect to Database
connectDB(); // Execute the function to establish a connection to the MongoDB database

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Avoid CORS policy issues with cross-origin media files
}));

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json()); // Automatically parse incoming requests with JSON payloads into req.body

// Express Session (required for passport callbacks, OAuth callback state checks)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'freshgrid_fallback_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Rate Limiter for Auth Routes
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs (high capacity but protective)
  message: {
    success: false,
    message: 'Too many login or registration attempts from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Basic Route
app.get('/', (req, res) => { // Define a GET route for the root URL path ('/')
  res.send('MERN Stack API is running...'); // Send a simple text response back to the client confirming the API works
});

const productRoutes = require('./src/routes/productRoutes');
const authRoutes = require('./src/routes/authRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const deliveryRoutes = require('./src/routes/deliveryRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const offerRoutes = require('./src/routes/offerRoutes');
const chatRoutes = require('./src/routes/chatRoutes');

// Use Routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/chat', chatRoutes);

app.listen(PORT, () => { // Start the Express server and have it listen for incoming connections on the specified port
  console.log(`Server is running on port ${PORT}`); // Log a success message to the console when the server starts successfully
});