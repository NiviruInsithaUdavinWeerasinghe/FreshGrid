const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const connectDB = require('../src/config/db');

const seedUser = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('Checking for existing user account user@gmail.com...');
    const userExists = await User.findOne({ email: 'user@gmail.com' });

    if (userExists) {
      console.log('User already exists. Updating password and verification status...');
      const salt = await bcrypt.genSalt(12);
      userExists.passwordHash = await bcrypt.hash('user123', salt);
      userExists.isVerified = true;
      userExists.name = 'user';
      await userExists.save();
      console.log('User credentials updated successfully!');
    } else {
      console.log('Creating new verified user account...');
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash('user123', salt);

      const user = new User({
        name: 'user',
        email: 'user@gmail.com',
        passwordHash,
        isVerified: true,
      });

      await user.save();
      console.log('User account seeded successfully!');
    }

    console.log('Complete. Exiting.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding user account:', error.message);
    process.exit(1);
  }
};

seedUser();
