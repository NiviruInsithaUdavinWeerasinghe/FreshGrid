const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Product = require('./src/models/Product');
const connectDB = require('./src/config/db');

async function createTextIndex() {
  await connectDB();
  await Product.createIndexes();
  console.log("Indexes created successfully!");
  process.exit(0);
}

createTextIndex();
