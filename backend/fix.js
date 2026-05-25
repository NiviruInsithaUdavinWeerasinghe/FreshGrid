const mongoose = require('mongoose');
require('dotenv').config({path: './.env'});
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Offer = require('./src/models/Offer');
  await Offer.updateMany({}, { $set: { validFrom: new Date('2026-05-20T00:00:00Z') } });
  console.log('Updated');
  mongoose.disconnect();
}).catch(console.error);
