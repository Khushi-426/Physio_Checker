// server.js

const express = require('express');
const connectDB = require('./config/db'); 
const authRoutes = require('./routes/auth'); 

// Load environment variables (MUST be called early)
require('dotenv').config(); 

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Connect to Database
connectDB();

// 2. Middleware
app.use(express.json()); // Allows the server to accept JSON data in the request body

// 3. Define Main Routes
app.use('/api/auth', authRoutes); 

// Basic Test Route (Optional)
app.get('/', (req, res) => {
    res.send('Rehabilitation Backend API is running.');
});

// 4. Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});