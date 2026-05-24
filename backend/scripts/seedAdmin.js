const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend directory root
dotenv.config({ path: path.join(__dirname, '../.env') });

const Admin = require('../src/models/Admin');
const connectDB = require('../src/config/db');

const seedAdmin = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('Checking for existing admin accounts...');
    const adminExists = await Admin.findOne({ username: 'admin' });

    if (adminExists) {
      console.log('Admin user with username "admin" already exists. Updating password...');
      const salt = await bcrypt.genSalt(12);
      adminExists.passwordHash = await bcrypt.hash('admin123', salt);
      adminExists.email = 'niviruedu2006@gmail.com';
      await adminExists.save();
      console.log('Admin credentials updated successfully!');
    } else {
      console.log('Creating new admin credentials...');
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash('admin123', salt);

      const admin = new Admin({
        username: 'admin',
        email: 'niviruedu2006@gmail.com',
        passwordHash,
      });

      await admin.save();
      console.log('New admin account seeded successfully!');
    }

    console.log('Seeding complete. Exiting.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin account:', error.message);
    process.exit(1);
  }
};

seedAdmin();
