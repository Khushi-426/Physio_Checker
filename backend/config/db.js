// config/db.js

const mongoose = require('mongoose');
// We need dotenv here to access process.env.MONGODB_URI
require('dotenv').config(); 

const url = process.env.MONGODB_URI;

const connectDB = async () => {
    try {
        await mongoose.connect(url, {
            // These options are often recommended for modern Mongoose/MongoDB connections
            // (No longer strictly needed in Mongoose 6+, but good practice)
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