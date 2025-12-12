// config/db.js

const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables here as a safety measure

const url = process.env.MONGODB_URI;

const connectDB = async () => {
    try {
        await mongoose.connect(url, {
            dbName: 'rehabDB' // Use the database name you defined
        });
        console.log('Database connected successfully.');
    } catch (err) {
        console.error('Error connecting to the database:', err.message);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;