const mongoose = require('mongoose'); // Import mongoose, an Object Data Modeling (ODM) library for MongoDB and Node.js

const connectDB = async () => { // Define an asynchronous function to handle the database connection
    try { // Start a try block to catch any errors during the connection process
        await mongoose.connect(process.env.MONGODB_URI); // Attempt to connect to MongoDB using the URI from environment variables
        console.log('MongoDB Atlas connected successfully.'); // Log a success message if the connection is established
    } catch (error) { // Catch any errors that occur during the connection attempt
        console.error('Database connection failed:', error.message); // Log the specific error message to the console
        process.exit(1); // Exit the Node.js process with a failure code (1) if the connection fails
    }
};

module.exports = connectDB; // Export the connectDB function so it can be imported and used in server.js