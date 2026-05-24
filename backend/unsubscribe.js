const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const User = require('./src/models/User');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    const result = await User.updateOne(
      { email: 'niviruinsitha2006@gmail.com' },
      { $set: { isSubscribedToPromotions: false } }
    );
    console.log('Update result:', result);
    console.log('Successfully unsubscribed user.');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
};
run();
