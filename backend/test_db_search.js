const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Product = require('./src/models/Product');
const connectDB = require('./src/config/db');

async function testSearch() {
  await connectDB();
  const message = "Hi... What vegetables do we have here and how are their prices?";
  const keywords = message.split(' ').filter(word => word.length > 3).join('|');
  console.log("Keywords pattern:", keywords);
  
  const relevantProducts = await Product.find({
    $or: [
      { name: { $regex: keywords, $options: 'i' } },
      { category: { $regex: keywords, $options: 'i' } },
      { description: { $regex: keywords, $options: 'i' } }
    ]
  }).limit(5);

  console.log("Found:", relevantProducts.map(p => p.name));
  process.exit(0);
}

testSearch();
